import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { DisciplineTable } from '../DisciplineTable/DisciplineTable';
import type { EducationPlan } from '../../types/plan';

export const SemesterAccordion = ({ plan }: { plan: EducationPlan }) => {
  const groups = [...new Set(plan.disciplines.map((item) => item.semester ?? 0))]
    .sort((a, b) => a - b)
    .map((semester) => ({
      semester,
      disciplines: plan.disciplines.filter((item) => (item.semester ?? 0) === semester),
    }));

  return (
    <Accordion type="multiple" defaultValue={groups.slice(0, 2).map((group) => String(group.semester))}>
      {groups.map((group) => (
        <AccordionItem key={group.semester} value={String(group.semester)}>
          <AccordionTrigger>
            {group.semester ? `${group.semester} семестр` : 'Без семестра'}
            <span className="ml-auto mr-4 text-xs text-slate-400">{group.disciplines.length} дисциплин</span>
          </AccordionTrigger>
          <AccordionContent>
            <DisciplineTable disciplines={group.disciplines} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
