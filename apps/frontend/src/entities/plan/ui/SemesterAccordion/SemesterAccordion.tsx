import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@shared/ui/accordion';
import { DisciplineTable } from '../DisciplineTable/DisciplineTable';
import type { EducationPlan } from '../../model/types';

export const SemesterAccordion = ({ plan }: { plan: EducationPlan }) => {
  const groups = [...new Set(plan.disciplines.map((item) => item.semester ?? 0))]
    .sort((a, b) => a - b)
    .map((semester) => {
      const disciplines = plan.disciplines.filter((item) => (item.semester ?? 0) === semester);
      return {
        semester,
        disciplines,
        hours: disciplines.reduce((sum, item) => sum + item.hours, 0),
      };
    });

  return (
    <Accordion type="multiple">
      {groups.map((group) => (
        <AccordionItem key={group.semester} value={String(group.semester)}>
          <AccordionTrigger>
            <span>{group.semester ? `${group.semester} семестр` : 'Без семестра'}</span>
            <span className="ml-auto mr-4 text-xs font-normal text-muted-foreground">
              {group.disciplines.length} дисциплин · {group.hours} ч.
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <DisciplineTable disciplines={group.disciplines} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
