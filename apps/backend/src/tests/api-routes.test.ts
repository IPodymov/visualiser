import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app';
import { authService } from '../modules/auth/auth.service';
import { comparisonService } from '../modules/comparison/comparison.service';
import { curriculaService } from '../modules/curricula/curricula.service';
import { disciplinesService } from '../modules/disciplines/disciplines.service';
import { downloadsService } from '../modules/downloads/downloads.service';
import { facultiesService } from '../modules/faculties/faculties.service';
import { filesService } from '../modules/files/files.service';
import { profileService } from '../modules/profile/profile.service';
import { specialitiesService } from '../modules/specialities/specialities.service';
import { usersService } from '../modules/users/users.service';
import { signAccessToken } from '../shared/jwt';

const user = {
  id: 1,
  email: 'student@example.com',
  fullName: 'Student',
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
};
const bearer = () => `Bearer ${signAccessToken({ userId: user.id, email: user.email })}`;

describe('API user journeys', () => {
  let downloadDirectory: string;
  let sourceFile: string;

  beforeEach(() => {
    downloadDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'eduplan-routes-'));
    sourceFile = path.join(downloadDirectory, 'plan.xlsx');
    fs.writeFileSync(sourceFile, 'curriculum');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(downloadDirectory, { recursive: true, force: true });
  });

  it('supports registration, login and current-user retrieval', async () => {
    vi.spyOn(authService, 'register').mockResolvedValue({ user, accessToken: 'register-token' });
    vi.spyOn(authService, 'login').mockResolvedValue({ user, accessToken: 'login-token' });
    vi.spyOn(authService, 'me').mockResolvedValue(user);
    const app = createApp();

    await request(app)
      .post('/api/auth/register')
      .send({ email: user.email, password: 'long-enough-password', fullName: 'Student' })
      .expect(201, { user: { ...user, createdAt: user.createdAt.toISOString(), updatedAt: user.updatedAt.toISOString() }, accessToken: 'register-token' });
    await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'long-enough-password' })
      .expect(200);
    await request(app).get('/api/auth/me').set('Authorization', bearer()).expect(200);

    expect(authService.me).toHaveBeenCalledWith(1);
  });

  it('lists, recommends, opens, validates and imports curricula', async () => {
    vi.spyOn(curriculaService, 'list').mockResolvedValue([{ id: 1 }] as never);
    vi.spyOn(curriculaService, 'recommend').mockResolvedValue([{ planId: 1 }] as never);
    const getById = vi.spyOn(curriculaService, 'getById').mockResolvedValue({ id: 1 } as never);
    vi.spyOn(curriculaService, 'getDisciplines').mockResolvedValue([{ id: 10 }] as never);
    vi.spyOn(curriculaService, 'validate').mockResolvedValue({ curriculumId: 1 } as never);
    vi.spyOn(curriculaService, 'importFit').mockResolvedValue({ imported: 1 } as never);
    const app = createApp();

    await request(app)
      .get('/api/curricula?specialityName=software&specialityCode=09.03&facultyId=2&admissionYear=2025')
      .expect(200, [{ id: 1 }]);
    await request(app)
      .post('/api/curricula/recommendations')
      .send({
        educationLevel: 'bachelor',
        studyForm: 'fullTime',
        limit: 3,
        weights: { software: 100 },
      })
      .expect(200, [{ planId: 1 }]);
    await request(app).get('/api/curricula/1').expect(200, { id: 1 });
    await request(app)
      .get('/api/curricula/1')
      .set('Authorization', bearer())
      .expect(200, { id: 1 });
    await request(app)
      .get('/api/curricula/1')
      .set('Authorization', 'Bearer invalid')
      .expect(200, { id: 1 });
    await request(app).get('/api/curricula/1/disciplines').expect(200, [{ id: 10 }]);
    await request(app).get('/api/curricula/1/validation').expect(200, { curriculumId: 1 });
    await request(app)
      .post('/api/curricula/import-fit')
      .set('Authorization', bearer())
      .expect(201, { imported: 1 });

    expect(getById.mock.calls.map((call) => call[1])).toEqual([undefined, 1, undefined]);
  });

  it('browses faculties, specialities and disciplines', async () => {
    const listFaculties = vi.spyOn(facultiesService, 'list').mockResolvedValue([{ id: 1 }] as never);
    vi.spyOn(specialitiesService, 'list').mockResolvedValue([{ id: 2 }] as never);
    vi.spyOn(specialitiesService, 'getById').mockResolvedValue({ id: 2 } as never);
    vi.spyOn(disciplinesService, 'list').mockResolvedValue([{ id: 3 }] as never);
    vi.spyOn(disciplinesService, 'getById').mockResolvedValue({ id: 3 } as never);
    const app = createApp();

    await request(app).get('/api/faculties?admissionYear=2025').expect(200, [{ id: 1 }]);
    await request(app).get('/api/faculties?admissionYear=not-a-year').expect(200, [{ id: 1 }]);
    await request(app).get('/api/specialities').expect(200, [{ id: 2 }]);
    await request(app).get('/api/specialities/2').expect(200, { id: 2 });
    await request(app).get('/api/disciplines').expect(200, [{ id: 3 }]);
    await request(app).get('/api/disciplines/3').expect(200, { id: 3 });

    expect(listFaculties).toHaveBeenNthCalledWith(1, { admissionYear: 2025 });
    expect(listFaculties).toHaveBeenNthCalledWith(2, { admissionYear: undefined });
  });

  it('compares two curricula through the comparison endpoint', async () => {
    vi.spyOn(comparisonService, 'compare').mockResolvedValue({ summary: { commonCount: 2 } } as never);

    await request(createApp())
      .get('/api/comparison?firstCurriculumId=1&secondCurriculumId=2')
      .expect(200, { summary: { commonCount: 2 } });
    expect(comparisonService.compare).toHaveBeenCalledWith(1, 2);
  });

  it('adds, lists and removes favorites and reads view history', async () => {
    vi.spyOn(profileService, 'favorites').mockResolvedValue([{ id: 1 }] as never);
    vi.spyOn(profileService, 'addFavorite').mockResolvedValue({ curriculumId: 2 } as never);
    vi.spyOn(profileService, 'removeFavorite').mockResolvedValue({ deleted: true });
    vi.spyOn(profileService, 'history').mockResolvedValue([{ id: 3 }] as never);
    const app = createApp();
    const authorization = bearer();

    await request(app).get('/api/profile/favorites').set('Authorization', authorization).expect(200);
    await request(app)
      .post('/api/profile/favorites/2')
      .set('Authorization', authorization)
      .expect(201, { curriculumId: 2 });
    await request(app)
      .delete('/api/profile/favorites/2')
      .set('Authorization', authorization)
      .expect(200, { deleted: true });
    await request(app).get('/api/profile/history').set('Authorization', authorization).expect(200);

    expect(profileService.addFavorite).toHaveBeenCalledWith(1, 2);
    expect(profileService.removeFavorite).toHaveBeenCalledWith(1, 2);
  });

  it('returns the authenticated user object only to its owner', async () => {
    vi.spyOn(usersService, 'getById').mockResolvedValue(user);

    await request(createApp())
      .get('/api/users/1')
      .set('Authorization', bearer())
      .expect(200);
    expect(usersService.getById).toHaveBeenCalledWith(1);
  });

  it('serves source files, discipline maps and comparison downloads', async () => {
    vi.spyOn(downloadsService, 'sourceFile').mockResolvedValue({
      sourceFilePath: sourceFile,
      sourceFileName: '../plan\r\n.xlsx',
    } as never);
    vi.spyOn(downloadsService, 'disciplineMap').mockResolvedValue({ id: 1 } as never);
    vi.spyOn(downloadsService, 'comparison').mockResolvedValue({ summary: {} } as never);
    const app = createApp();

    const source = await request(app)
      .get('/api/downloads/curricula/1')
      .set('Authorization', bearer())
      .expect(200);
    await request(app).get('/api/downloads/curricula/1/discipline-map').expect(200, { id: 1 });
    await request(app)
      .get('/api/downloads/comparison?firstCurriculumId=1&secondCurriculumId=2')
      .expect(200, { summary: {} });

    expect(source.headers['content-disposition']).not.toMatch(/[\r\n]/);
    vi.mocked(downloadsService.sourceFile).mockResolvedValueOnce({
      sourceFilePath: sourceFile,
      sourceFileName: '',
    } as never);
    const fallbackName = await request(app).get('/api/downloads/curricula/1').expect(200);
    expect(fallbackName.headers['content-disposition']).toContain('curriculum.xlsx');
    expect(downloadsService.sourceFile).toHaveBeenCalledWith(1, 1);
    expect(downloadsService.disciplineMap).toHaveBeenCalledWith(1, undefined);
    expect(downloadsService.comparison).toHaveBeenCalledWith(1, 2, undefined);
  });

  it('accepts a small XLSX upload under an opaque generated name', async () => {
    const app = createApp();
    const response = await request(app)
      .post('/api/files/fit')
      .set('Authorization', bearer())
      .attach('file', Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00]), {
        filename: 'curriculum.XLSX',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      .expect(201);

    expect(response.body.fileName).toMatch(/^[0-9a-f-]+\.xlsx$/);
    expect(response.body.path).toBe(response.body.fileName);
    fs.unlinkSync(path.join(filesService.fitUploadDirectory(), response.body.fileName));
  });

  it('validates every identifier and recommendation payload before controller calls', async () => {
    const getSpeciality = vi.spyOn(specialitiesService, 'getById');
    const getDiscipline = vi.spyOn(disciplinesService, 'getById');
    const recommend = vi.spyOn(curriculaService, 'recommend');

    await request(createApp()).get('/api/specialities/0').expect(400);
    await request(createApp()).get('/api/disciplines/-1').expect(400);
    await request(createApp())
      .post('/api/curricula/recommendations')
      .send({ weights: { unknown: 100 } })
      .expect(400);
    await request(createApp())
      .post('/api/curricula/recommendations')
      .send({ limit: 13, weights: { software: 100 } })
      .expect(400);
    await request(createApp())
      .post('/api/curricula/recommendations')
      .send({ weights: { software: 0 } })
      .expect(400);

    expect(getSpeciality).not.toHaveBeenCalled();
    expect(getDiscipline).not.toHaveBeenCalled();
    expect(recommend).not.toHaveBeenCalled();
  });
});
