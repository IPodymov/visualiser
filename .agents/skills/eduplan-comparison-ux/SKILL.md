---
name: eduplan-comparison-ux
description: Implement EduPlan Compare's A/B selection, similarity, deltas and discipline differences so users can interpret two curricula quickly. Use for any comparison flow or comparison indicator.
---

# EduPlan Comparison UX

Treat comparison as the product's central analytical journey. Preserve identity, direction and context instead of presenting two columns of raw numbers.

## Selection contract

- Maintain two fixed slots: Program A and Program B.
- Replacing one slot must not reset or reorder the other.
- Prevent selecting the same plan twice and explain why the option is unavailable.
- Keep selected plan name, code/year and A/B marker visible above results.
- On mobile, stack selectors while keeping equal visual importance.

## Required summary

When data exists, show:

- discipline counts A and B;
- common count;
- only-A and only-B counts;
- discipline-name similarity percentage and formula explanation;
- total-hour delta;
- credit delta;
- lecture, practice, lab and independent-work differences;
- semester workload comparison;
- changed common disciplines and separate unique lists.

## Direction semantics

Use `ComparisonIndicator` states: more, less, equal, only A, only B. Always name the program or A/B side in text. Signed deltas include unit and reference direction, for example “В программе A на 240 ч больше”.

Common-discipline detail shows only fields that differ. Exact equal values are omitted from the difference table. Unique disciplines never appear as missing numeric rows in the common table.

## Interpretation rules

- Similarity means name overlap, not educational equivalence or quality.
- A larger workload indicates volume, not superiority.
- A different semester indicates timing, not automatically greater depth.
- Explain what lecture/practice/lab differences may change in learning format without promising outcomes.
- Keep download, save and deep-link actions secondary to understanding the comparison.

Test empty, one-plan, two-plan, same-plan, loading, API error and plans-with-missing-values states.
