---
name: eduplan-product-meaning
description: Define the user purpose, decision and action hierarchy for EduPlan Compare pages and substantial features. Use before creating or materially changing a product screen; do not use for purely mechanical refactors with unchanged behaviour.
---

# EduPlan Product Meaning

Make each screen help a person understand or decide something about an educational program. Data availability is not a reason to create a block or page.

## Frame the screen

Before implementation, state in working notes:

1. Primary user for this visit: applicant, student, teacher, or education employee.
2. Entry intent: why they arrived now.
3. One question the screen resolves.
4. Primary action and one or two secondary actions.
5. Decision or next step enabled after reading the data.

If these cannot be answered, stop adding UI and clarify the screen's role in the journey.

## Product decision rules

- Lead with the object or decision, not a feature name such as dashboard, radar, or table.
- Prefer evidence that reduces uncertainty: program identity, workload, timing, formats, overlap, and uniqueness.
- Pair a meaningful metric group with a neutral explanation or explicit next action.
- Separate product demonstrations from live values. Label illustrative data as an example.
- Do not infer program quality, difficulty, career outcomes, or suitability from hours alone.
- Interest matching may guide exploration, but must not claim to determine the user's future.

## Page checks

Confirm that a first-time visitor can answer:

- Where am I and what object/action is this?
- What can I learn or do here?
- Which element deserves attention first?
- What should I do with what I learned?

Read [the design specification](../../../docs/design-specification.md) when the task changes page scope, navigation, or a user flow.
