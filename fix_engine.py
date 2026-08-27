with open('src/engine/BCCAAEngine.ts', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(
    'timelineValidation: { isValid: true, errors: [], warnings: [], calculationType },',
    'timelineValidation: { isValid: true, errors: [], warnings: [] },'
)
c = c.replace(
    '        chronology: ctx.eventTimeline,\n        contradictionGraph: ctx.contradictionGraph,',
    '        contradictionGraph: ctx.contradictionGraph,'
)

with open('src/engine/BCCAAEngine.ts', 'w', encoding='utf-8') as f:
    f.write(c)
print("Engine fixed")
