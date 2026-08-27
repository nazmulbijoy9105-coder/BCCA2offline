with open('src/engine/BCCAAEngine.phase2.test.ts', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('for (const p of r.stage2.precedents) {', 'for (const p of r.stage2!.precedents!) {')
c = c.replace('r.stage2.precedents.length)', '(r.stage2!.precedents!).length)')

with open('src/engine/BCCAAEngine.phase2.test.ts', 'w', encoding='utf-8') as f:
    f.write(c)
print("Tests fixed")
