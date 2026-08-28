# Recommended project structure

```text
project/
  main.forge.js
  params.forge.js
  modules/
    envelope/
    structure/
    equipment/
    context/
    details/
    inferred/
  reference/
    originals/
    crops/
    structural-studies/
  evidence/
    envelope/
    element-name/
    canonical-views/
    final-audit/
  docs/
    EVIDENCE-LEDGER.md
    ELEMENT-INVENTORY.md
    ITERATION-LOG.md
    FINAL-READINESS.md
  exports/
```

## Authoring conventions

- Put global dimensions, camera values, and presentation settings in named parameter objects.
- Give every complex or repeated element a module that returns a component/assembly.
- Keep geometry generation separate from placement transforms.
- Use arrays/data tables for counted repetitions and intentional asymmetry.
- Name modules by visible function, not arbitrary layer numbers.
- Keep inferred hidden geometry in a separate module tree.
- Add concise comments explaining evidence or non-obvious construction intent, not every primitive.
- Avoid monolithic source files, magic-number scattering, and copy-pasted repeated solids.

## Change isolation

After M1, changing a small prop must not alter the building/product envelope or camera. After a family passes, expose only its intended parameters to later assembly code. This makes regressions traceable and allows a newly supplied reference to replace an inferred module cleanly.
