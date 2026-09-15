import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  hashPassword: vi.fn(async (password: string) => `hashed:${password}`),
  verifyPassword: vi.fn(async () => false),
  importFitCurricula: vi.fn(async () => ({ imported: 1 })),
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    curriculum: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    curriculumDiscipline: { findMany: vi.fn() },
    discipline: { findMany: vi.fn(), findUnique: vi.fn() },
    faculty: { findMany: vi.fn(), upsert: vi.fn() },
    speciality: { findMany: vi.fn(), findUnique: vi.fn() },
    favoriteCurriculum: { findMany: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() },
    viewHistory: { create: vi.fn(), findMany: vi.fn() },
    downloadHistory: { create: vi.fn() },
  },
}));

vi.mock('../config/prisma', () => ({ prisma: mocks.prisma }));
vi.mock('../shared/password', () => ({
  hashPassword: mocks.hashPassword,
  verifyPassword: mocks.verifyPassword,
}));
vi.mock('../modules/curricula/fit-importer.service', () => ({
  importFitCurricula: mocks.importFitCurricula,
}));

import { env } from '../config/env';
import { AuthService } from '../modules/auth/auth.service';
import { comparisonService } from '../modules/comparison/comparison.service';
import { CurriculaService } from '../modules/curricula/curricula.service';
import { curriculaService } from '../modules/curricula/curricula.service';
import { DisciplinesService } from '../modules/disciplines/disciplines.service';
import { DownloadsService } from '../modules/downloads/downloads.service';
import { FacultiesService } from '../modules/faculties/faculties.service';
import { FilesService } from '../modules/files/files.service';
import { ProfileService } from '../modules/profile/profile.service';
import { SpecialitiesService } from '../modules/specialities/specialities.service';
import { UsersService } from '../modules/users/users.service';
import { verifyAccessToken } from '../shared/jwt';

const now = new Date('2025-01-01T00:00:00.000Z');
const publicUser = {
  id: 1,
  email: 'student@example.com',
  fullName: 'Student',
  createdAt: now,
  updatedAt: now,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('authentication service', () => {
  const service = new AuthService();

  it('registers a new user without exposing a password hash', async () => {
    mocks.prisma.user.findUnique.mockResolvedValue(null);
    mocks.prisma.user.create.mockResolvedValue(publicUser);

    const result = await service.register({
      email: publicUser.email,
      fullName: publicUser.fullName,
      password: 'long-enough-password',
    });

    expect(mocks.hashPassword).toHaveBeenCalledWith('long-enough-password');
    expect(mocks.prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ passwordHash: 'hashed:long-enough-password' }),
        select: expect.not.objectContaining({ passwordHash: true }),
      }),
    );
    expect(result.user).toEqual(publicUser);
    expect(verifyAccessToken(result.accessToken)).toMatchObject({ userId: 1, email: publicUser.email });
  });

  it('rejects duplicate registration', async () => {
    mocks.prisma.user.findUnique.mockResolvedValue(publicUser);

    await expect(
      service.register({ email: publicUser.email, password: 'long-enough-password' }),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(mocks.prisma.user.create).not.toHaveBeenCalled();
  });

  it('logs in with valid credentials and returns only public user data', async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({ ...publicUser, passwordHash: 'stored-hash' });
    mocks.verifyPassword.mockResolvedValue(true);

    const result = await service.login({ email: publicUser.email, password: 'correct-password' });

    expect(mocks.verifyPassword).toHaveBeenCalledWith('correct-password', 'stored-hash');
    expect(result.user).toEqual(publicUser);
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('uses a dummy hash for unknown users and rejects invalid passwords uniformly', async () => {
    mocks.prisma.user.findUnique.mockResolvedValue(null);
    mocks.verifyPassword.mockResolvedValue(false);

    await expect(
      service.login({ email: 'missing@example.com', password: 'wrong-password' }),
    ).rejects.toMatchObject({ statusCode: 401, message: 'Invalid email or password' });
    expect(mocks.verifyPassword).toHaveBeenCalledWith('wrong-password', expect.stringMatching(/^\$2b\$/));

    mocks.prisma.user.findUnique.mockResolvedValue({ ...publicUser, passwordHash: 'stored-hash' });
    await expect(
      service.login({ email: publicUser.email, password: 'wrong-password' }),
    ).rejects.toMatchObject({ statusCode: 401, message: 'Invalid email or password' });
  });

  it('returns the current user or a not-found error', async () => {
    mocks.prisma.user.findUnique.mockResolvedValueOnce(publicUser).mockResolvedValueOnce(null);

    await expect(service.me(1)).resolves.toEqual(publicUser);
    await expect(service.me(2)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('catalog domain services', () => {
  it('lists faculties with and without an admission-year filter', async () => {
    const service = new FacultiesService();
    mocks.prisma.faculty.findMany.mockResolvedValue([]);

    await service.list();
    expect(mocks.prisma.faculty.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { curricula: { some: { admissionYear: undefined } } } }),
    );
    await service.list({ admissionYear: 2025 });
    expect(mocks.prisma.faculty.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { curricula: { some: { admissionYear: 2025 } } } }),
    );
  });

  it('lists and loads specialities, including not-found', async () => {
    const service = new SpecialitiesService();
    mocks.prisma.speciality.findMany.mockResolvedValue([{ id: 1 }]);
    mocks.prisma.speciality.findUnique
      .mockResolvedValueOnce({ id: 1, curricula: [] })
      .mockResolvedValueOnce(null);

    await expect(service.list()).resolves.toEqual([{ id: 1 }]);
    await expect(service.getById(1)).resolves.toMatchObject({ id: 1 });
    await expect(service.getById(2)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('lists and loads disciplines, including not-found', async () => {
    const service = new DisciplinesService();
    mocks.prisma.discipline.findMany.mockResolvedValue([{ id: 1 }]);
    mocks.prisma.discipline.findUnique
      .mockResolvedValueOnce({ id: 1, classifications: [] })
      .mockResolvedValueOnce(null);

    await expect(service.list()).resolves.toEqual([{ id: 1 }]);
    await expect(service.getById(1)).resolves.toMatchObject({ id: 1 });
    await expect(service.getById(2)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('loads only an existing user', async () => {
    const service = new UsersService();
    mocks.prisma.user.findUnique.mockResolvedValueOnce(publicUser).mockResolvedValueOnce(null);

    await expect(service.getById(1)).resolves.toEqual(publicUser);
    await expect(service.getById(2)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('profile service', () => {
  const service = new ProfileService();

  it('returns favorites and history scoped to the authenticated user', async () => {
    mocks.prisma.favoriteCurriculum.findMany.mockResolvedValue([{ id: 1 }]);
    mocks.prisma.viewHistory.findMany.mockResolvedValue([{ id: 2 }]);

    await expect(service.favorites(7)).resolves.toEqual([{ id: 1 }]);
    await expect(service.history(7)).resolves.toEqual([{ id: 2 }]);
    expect(mocks.prisma.favoriteCurriculum.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 7 }, orderBy: { addedAt: 'desc' } }),
    );
    expect(mocks.prisma.viewHistory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 7 }, take: 100 }),
    );
  });

  it('adds an existing curriculum idempotently and rejects a missing curriculum', async () => {
    mocks.prisma.curriculum.findUnique
      .mockResolvedValueOnce({ id: 3 })
      .mockResolvedValueOnce(null);
    mocks.prisma.favoriteCurriculum.upsert.mockResolvedValue({ userId: 7, curriculumId: 3 });

    await expect(service.addFavorite(7, 3)).resolves.toEqual({ userId: 7, curriculumId: 3 });
    expect(mocks.prisma.favoriteCurriculum.upsert).toHaveBeenCalledWith({
      where: { userId_curriculumId: { userId: 7, curriculumId: 3 } },
      create: { userId: 7, curriculumId: 3 },
      update: {},
    });
    await expect(service.addFavorite(7, 404)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('removes a favorite without affecting another user', async () => {
    mocks.prisma.favoriteCurriculum.deleteMany.mockResolvedValue({ count: 1 });

    await expect(service.removeFavorite(7, 3)).resolves.toEqual({ deleted: true });
    expect(mocks.prisma.favoriteCurriculum.deleteMany).toHaveBeenCalledWith({
      where: { userId: 7, curriculumId: 3 },
    });
  });
});

const classification = {
  weight: 0.75,
  classificationValue: {
    code: 'AI',
    name: 'Искусственный интеллект',
    group: { code: 'TECH', name: 'Технологии' },
  },
};

const visualDisciplines = [
  {
    id: 11,
    curriculumId: 1,
    disciplineId: 101,
    externalDisciplineCode: 'Б1.1',
    semesterNumber: 2,
    controlForm: 'Экзамен, Зачёт',
    blockName: 'Блок 1',
    partName: 'Обязательная часть',
    moduleName: 'Модуль',
    recordType: 'Дисциплина',
    totalHours: 144,
    credits: 4,
    lectureHours: 36,
    practiceHours: 18,
    labHours: 18,
    independentHours: 72,
    discipline: { name: 'Машинное обучение', classifications: [classification] },
  },
  {
    id: 12,
    curriculumId: 1,
    disciplineId: 102,
    externalDisciplineCode: null,
    semesterNumber: null,
    controlForm: null,
    blockName: null,
    partName: null,
    moduleName: null,
    recordType: null,
    totalHours: null,
    credits: null,
    lectureHours: null,
    practiceHours: null,
    labHours: null,
    independentHours: null,
    discipline: { name: 'Проект', classifications: [] },
  },
];

const visualizationCurriculum = {
  id: 1,
  specialityId: 1,
  facultyId: 1,
  admissionYear: 2025,
  educationLevel: 'Бакалавриат',
  educationForm: 'Очная',
  profileName: 'ИИ',
  sourceFileName: 'plan.xlsx',
  sourceFilePath: '/data/2025/ФИТ/plan.xlsx',
  sourceFileHash: 'hash',
  uploadedAt: now,
  faculty: { id: 1, name: 'ФИТ' },
  speciality: { id: 1, code: '09.03.04', name: 'Программная инженерия' },
  disciplines: visualDisciplines,
};

describe('curricula service', () => {
  const service = new CurriculaService();

  it('builds list filters without interpolating input', async () => {
    mocks.prisma.curriculum.findMany.mockResolvedValue([]);

    await service.list({
      specialityCode: '09.03',
      specialityName: 'Информатика',
      facultyId: 2,
      admissionYear: 2025,
    });
    expect(mocks.prisma.curriculum.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          admissionYear: 2025,
          facultyId: 2,
          speciality: {
            code: { contains: '09.03', mode: 'insensitive' },
            name: { contains: 'Информатика', mode: 'insensitive' },
          },
        },
      }),
    );

    await service.list({});
    expect(mocks.prisma.curriculum.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ speciality: { code: undefined, name: undefined } }),
      }),
    );
  });

  it('maps a curriculum into semesters, classifications and source-backed chart data', async () => {
    mocks.prisma.curriculum.findUnique.mockResolvedValue(visualizationCurriculum);
    mocks.prisma.viewHistory.create.mockResolvedValue({});

    const result = await service.getById(1, 7);

    expect(mocks.prisma.viewHistory.create).toHaveBeenCalledWith({
      data: { userId: 7, curriculumId: 1 },
    });
    expect(result.semesters.map((semester) => semester.number)).toEqual([null, 2]);
    expect(result.semesters[1].disciplines[0].classifications).toEqual([
      {
        groupCode: 'TECH',
        groupName: 'Технологии',
        valueCode: 'AI',
        valueName: 'Искусственный интеллект',
        weight: 0.75,
      },
    ]);
    expect(result.visualization.totals).toMatchObject({
      disciplinesCount: 2,
      totalHours: 144,
      credits: 4,
      contactHours: 72,
    });
    expect(result.visualization.bySemester.map((bucket) => bucket.key)).toContain('unknown');
    expect(result.visualization.controlForms).toEqual([
      { form: 'Экзамен', count: 1 },
      { form: 'Зачёт', count: 1 },
    ]);
  });

  it('does not write history for an anonymous view and rejects a missing curriculum', async () => {
    mocks.prisma.curriculum.findUnique
      .mockResolvedValueOnce(visualizationCurriculum)
      .mockResolvedValueOnce(null);

    await service.getById(1);
    expect(mocks.prisma.viewHistory.create).not.toHaveBeenCalled();
    await expect(service.getById(404)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('loads disciplines only for an existing curriculum', async () => {
    mocks.prisma.curriculum.findUnique.mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce(null);
    mocks.prisma.curriculumDiscipline.findMany.mockResolvedValue(visualDisciplines);

    await expect(service.getDisciplines(1)).resolves.toEqual(visualDisciplines);
    await expect(service.getDisciplines(404)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('delegates FIT import', async () => {
    await expect(service.importFit()).resolves.toEqual({ imported: 1 });
    expect(mocks.importFitCurricula).toHaveBeenCalledOnce();
  });

  it('validates stored curricula or reports a missing id', async () => {
    mocks.prisma.curriculum.findUnique
      .mockResolvedValueOnce(visualizationCurriculum)
      .mockResolvedValueOnce(null);

    const result = await service.validate(1);
    expect(result.curriculumId).toBe(1);
    expect(result.validation.stats.disciplinesCount).toBe(2);
    await expect(service.validate(404)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('ranks recommendations and exercises strict and fallback candidate selection', async () => {
    const base = {
      ...visualizationCurriculum,
      disciplines: visualDisciplines,
    };
    const bachelor = { ...base, id: 1 };
    const master = {
      ...base,
      id: 2,
      profileName: null,
      faculty: null,
      educationLevel: null,
      educationForm: 'Заочная',
      admissionYear: null,
      uploadedAt: new Date('2024-01-01T00:00:00.000Z'),
      sourceFilePath: '/root/2024/ФИТ/plan.xlsx',
      speciality: { id: 2, code: '09.04.01', name: 'Информатика' },
      disciplines: visualDisciplines.slice(0, 1),
    };
    const specialist = {
      ...base,
      id: 3,
      educationLevel: '',
      educationForm: null,
      faculty: null,
      sourceFilePath: 'fakultet/ФИТ-plan.xlsx',
      speciality: { id: 3, code: '10.05.01', name: 'Безопасность' },
      disciplines: [],
    };
    const longBachelor = {
      ...base,
      id: 4,
      educationLevel: null,
      educationForm: null,
      faculty: null,
      sourceFilePath: undefined,
      speciality: { id: 4, code: '09.03.02', name: 'Информационные системы' },
      disciplines: Array.from({ length: 5 }, (_, index) => ({
        ...visualDisciplines[0],
        id: 40 + index,
        disciplineId: 140 + index,
        semesterNumber: index + 1,
        totalHours: index === 0 ? 144 : 36,
        discipline: {
          name: index < 2 ? (index === 0 ? 'Машинное обучение' : 'Алгоритмы ИИ') : `Проект ${index}`,
          classifications: index === 0 ? [classification] : [],
        },
      })),
    };
    const markerFaculty = {
      ...base,
      id: 5,
      educationForm: null,
      faculty: null,
      sourceFilePath: 'archive-ФИТ-plan.xlsx',
      disciplines: [],
    };
    const defaultFacultyWithoutSlash = {
      ...base,
      id: 6,
      educationForm: null,
      faculty: null,
      sourceFilePath: 'archive-plan.xlsx',
      disciplines: [],
    };
    const defaultFacultyWithSlash = {
      ...base,
      id: 7,
      educationForm: null,
      faculty: null,
      sourceFilePath: '/archive/2025/no-faculty/plan.xlsx',
      disciplines: [],
    };
    mocks.prisma.curriculum.findMany.mockResolvedValue([
      bachelor,
      master,
      specialist,
      longBachelor,
      markerFaculty,
      defaultFacultyWithoutSlash,
      defaultFacultyWithSlash,
    ]);

    const strict = await service.recommend({
      educationLevel: 'bachelor',
      studyForm: 'fullTime',
      limit: 2,
      weights: { ai: 100, software: 50 },
    });
    expect(strict[0]).toMatchObject({ planId: 1, level: 'Бакалавриат', duration: '2 года' });
    expect(strict[0].matchedDisciplines).toContain('Машинное обучение');

    const levelFallback = await service.recommend({
      educationLevel: 'master',
      studyForm: 'evening',
      weights: { research: 10 },
    });
    expect(levelFallback[0]).toMatchObject({ planId: 2, level: 'Магистратура' });

    const formFallback = await service.recommend({
      educationLevel: 'postgraduate',
      studyForm: 'partTime',
      weights: { security: 0 },
    });
    expect(formFallback[0].studyForm).toBe('Заочная');

    const allFallback = await service.recommend({
      educationLevel: 'postgraduate',
      studyForm: 'evening',
      weights: { security: 0 },
    });
    expect(allFallback).toHaveLength(7);
    expect(allFallback.some((item) => item.duration === 'не указана')).toBe(true);
    expect(allFallback.some((item) => item.level === 'Специалитет')).toBe(true);

    const unfiltered = await service.recommend({
      weights: { ai: 100, software: 50, data: 25, security: 10 },
    });
    expect(unfiltered.find((item) => item.planId === 4)).toMatchObject({
      faculty: 'Университет',
      level: 'Бакалавриат',
      duration: '4 года',
    });
    expect(unfiltered.find((item) => item.planId === 5)?.faculty).toBe('ФИТ');
    expect(unfiltered.find((item) => item.planId === 6)?.faculty).toBe('Университет');
    expect(unfiltered.find((item) => item.planId === 7)?.faculty).toBe('Университет');

    mocks.prisma.curriculum.findMany.mockResolvedValue([]);
    await expect(service.recommend({ weights: { ai: 100 } })).resolves.toEqual([]);
  });
});

describe('downloads and files services', () => {
  it('downloads only files inside configured FIT roots and logs authenticated access', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'eduplan-download-'));
    const filePath = path.join(root, 'plan.xlsx');
    fs.writeFileSync(filePath, 'workbook');
    const previousFitDir = env.FIT_DIR;
    Object.assign(env, { FIT_DIR: root });
    const service = new DownloadsService();
    mocks.prisma.curriculum.findUnique.mockResolvedValue({
      id: 1,
      sourceFilePath: filePath,
      sourceFileName: 'plan.xlsx',
    });
    mocks.prisma.downloadHistory.create.mockResolvedValue({});

    const result = await service.sourceFile(1, 7);
    expect(result.sourceFilePath).toBe(fs.realpathSync(filePath));
    expect(mocks.prisma.downloadHistory.create).toHaveBeenCalledWith({
      data: { userId: 7, curriculumId: 1, downloadType: 'SOURCE_CURRICULUM' },
    });

    Object.assign(env, { FIT_DIR: previousFitDir });
  });

  it('rejects missing records, missing files and files outside allowed roots', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'eduplan-download-root-'));
    const outside = path.join(os.tmpdir(), `outside-${Date.now()}.xlsx`);
    fs.writeFileSync(outside, 'workbook');
    const previousFitDir = env.FIT_DIR;
    Object.assign(env, { FIT_DIR: root });
    const service = new DownloadsService();

    mocks.prisma.curriculum.findUnique.mockResolvedValueOnce(null);
    await expect(service.sourceFile(1)).rejects.toMatchObject({ statusCode: 404 });
    mocks.prisma.curriculum.findUnique.mockResolvedValueOnce({
      id: 1,
      sourceFilePath: path.join(root, 'missing.xlsx'),
    });
    await expect(service.sourceFile(1)).rejects.toMatchObject({ statusCode: 404 });
    mocks.prisma.curriculum.findUnique.mockResolvedValueOnce({
      id: 1,
      sourceFilePath: outside,
    });
    await expect(service.sourceFile(1)).rejects.toMatchObject({ statusCode: 404 });
    mocks.prisma.curriculum.findUnique.mockResolvedValueOnce({
      id: 1,
      sourceFilePath: root,
    });
    await expect(service.sourceFile(1)).rejects.toMatchObject({ statusCode: 404 });

    Object.assign(env, { FIT_DIR: path.join(root, 'missing-root') });
    mocks.prisma.curriculum.findUnique.mockResolvedValueOnce({
      id: 1,
      sourceFilePath: outside,
    });
    await expect(service.sourceFile(1)).rejects.toMatchObject({ statusCode: 404 });

    Object.assign(env, { FIT_DIR: previousFitDir });
  });

  it('builds discipline-map and comparison downloads and records every event', async () => {
    const service = new DownloadsService();
    vi.spyOn(curriculaService, 'getById').mockResolvedValue({ id: 1 } as never);
    vi.spyOn(comparisonService, 'compare').mockResolvedValue({ summary: {} } as never);
    mocks.prisma.downloadHistory.create.mockResolvedValue({});

    await expect(service.disciplineMap(1)).resolves.toEqual({ id: 1 });
    await expect(service.comparison(1, 2, 7)).resolves.toEqual({ summary: {} });

    expect(mocks.prisma.downloadHistory.create).toHaveBeenCalledTimes(3);
    expect(mocks.prisma.downloadHistory.create).toHaveBeenNthCalledWith(1, {
      data: { userId: undefined, curriculumId: 1, downloadType: 'DISCIPLINE_MAP' },
    });
    expect(mocks.prisma.downloadHistory.create).toHaveBeenNthCalledWith(2, {
      data: { userId: 7, curriculumId: 1, downloadType: 'COMPARISON_RESULT' },
    });
    expect(mocks.prisma.downloadHistory.create).toHaveBeenNthCalledWith(3, {
      data: { userId: 7, curriculumId: 2, downloadType: 'COMPARISON_RESULT' },
    });
  });

  it('resolves upload directories and requires a file', async () => {
    const service = new FilesService();
    expect(path.isAbsolute(service.fitUploadDirectory())).toBe(true);
    await expect(service.uploaded()).rejects.toMatchObject({ statusCode: 400 });
  });

  it('accepts a ZIP-signature workbook and returns no internal path', async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'eduplan-upload-service-'));
    const filePath = path.join(directory, 'opaque.xlsx');
    fs.writeFileSync(filePath, Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00]));
    const service = new FilesService();
    vi.spyOn(service, 'fitUploadDirectory').mockReturnValue(directory);

    await expect(
      service.uploaded({ path: filePath, filename: 'opaque.xlsx' } as Express.Multer.File),
    ).resolves.toEqual({ fileName: 'opaque.xlsx', path: 'opaque.xlsx' });
  });

  it('still returns a safe validation error when cleanup of an invalid upload fails', async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'eduplan-upload-cleanup-'));
    const filePath = path.join(directory, 'invalid.xlsx');
    fs.writeFileSync(filePath, 'not-a-workbook');
    const service = new FilesService();
    vi.spyOn(service, 'fitUploadDirectory').mockReturnValue(directory);
    const unlink = vi.spyOn(fsPromises, 'unlink').mockRejectedValueOnce(new Error('locked'));

    await expect(
      service.uploaded({ path: filePath, filename: 'invalid.xlsx' } as Express.Multer.File),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(unlink).toHaveBeenCalledWith(filePath);
    unlink.mockRestore();
    fs.unlinkSync(filePath);
  });

  it('does not use a multipart path outside the upload directory', async () => {
    const uploadDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'eduplan-upload-service-'));
    const outsideDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'eduplan-upload-outside-'));
    const outsidePath = path.join(outsideDirectory, 'opaque.xlsx');
    fs.writeFileSync(outsidePath, Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00]));
    const service = new FilesService();
    vi.spyOn(service, 'fitUploadDirectory').mockReturnValue(uploadDirectory);

    await expect(
      service.uploaded({ path: outsidePath, filename: 'opaque.xlsx' } as Express.Multer.File),
    ).rejects.toThrow();
    expect(fs.existsSync(outsidePath)).toBe(true);
  });
});
