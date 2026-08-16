# Ask Mearva — Arabic QA Test Set

Realistic Arabic questions for reviewing Ask Mearva's Arabic **language quality**
(not facts). For each answer, reviewers check: spelling, grammar (hamza, taa
marbuta, agreement, word order), natural phrasing (no English calques), correct
register (professional MSA, no colloquial in the assistant's own words), no
English mixing beyond approved tokens, consistent numerals/units — and that
**no fact, number, price/availability rule, or regulatory wording changed.**

How to run: send each as `{"language":"ar","messages":[{"role":"user",
"content":"…"}]}` to `POST /api/chat`. Some items are intentionally colloquial
(Gulf) to check that the reply stays clean MSA while adapting warmly.

## Test questions (28)

1. لماذا السلمون النرويجي؟
2. أخبرني عن السلمون النرويجي الأطلسي.
3. وش الفرق بين الطازج والمجمد؟  *(colloquial input)*
4. هل يمكنكم توفير كميات أسبوعية بشكل منتظم؟
5. أحتاج توصيل إلى الرياض، كيف تتم العملية؟
6. هل تشحنون إلى جدة؟
7. عندي مطعم في الدمام، ماذا تقترحون؟  
8. ما الحد الأدنى للطلب؟
9. كم سعر السلمون؟
10. ما الأحجام والتدريجات المتوفرة؟
11. كيف يتم تغليف وتعبئة السلمون؟
12. اشرح لي سلسلة التبريد.
13. هل تستخدمون الشحن الجوي؟
14. كم تستغرق مدة التسليم؟
15. ما الشهادات والوثائق المطلوبة للتصدير إلى السعودية؟
16. من أين مصدر السلمون؟
17. أنا صاحب سلسلة مطاعم، كيف نبدأ التعامل؟
18. أعمل في مجموعة فنادق ونحتاج توريداً منتظماً.
19. أنا موزّع، هل يمكنني الشراء بكميات كبيرة؟
20. أبغى 500 كجم سلمون كل أسبوع للرياض.  *(colloquial input)*
21. نحتاج طناً واحداً شهرياً، هل هذا متاح؟
22. هل المنتج متوفر حالياً؟
23. ما مستوى الجودة الذي تقدمونه؟
24. كم مدة صلاحية السلمون الطازج؟
25. سؤال متابعة: وهل نفس الكلام ينطبق على التراوت؟
26. لو أرسلت لكم طلبي، متى يردّ فريق المبيعات؟
27. هل أنتم معتمدون من الهيئة السعودية للغذاء والدواء؟
28. أرغب في تجهيز طلب: سلمون طازج، 800 كجم أسبوعياً، وجهة جدة.

## What "good" looks like (per the style guide)

- Direct answer first, ~60–120 words, short professional MSA sentences.
- No «زبداني/زبدية»; use «نكهة غنية وملمس ناعم».
- No «B2B» inside Arabic; use «المشترين التجاريين / قطاع الأعمال».
- No «المحترفين» for buyers; use «التجاريين».
- Correct grammar: «تنتج النرويج…» not «نرويجي تنتج…».
- Prices/availability/SFDA/MOQ answered with the approved hedged wording — no
  invented figures.
- Colloquial inputs (3, 20) get clean, warm MSA replies — never slang back.
- Follow-up chips (`::SUGGEST::`) and lead confirmation in clean MSA; lead
  qualification asks only for missing fields.

## Reference: before → target (language only)

Captured from the current live assistant ("before"), with the target phrasing
the improved guide/prompt enforces ("after"). Facts are identical in both.

- Before: «...لحم متماسك وطعم زبداني خفيف...»
  After:  «...قوام متماسك ونكهة غنية وملمس ناعم...»
- Before: «...يُسهّل التخطيط الشرائي لمشترين B2B.»
  After:  «...يُسهّل التخطيط الشرائي للمشترين التجاريين.»
- Before: «نرويجي تنتج اليوم أكثر من 1.25 مليون طن...»
  After:  «تنتج النرويج اليوم أكثر من 1.25 مليون طن...»
- Before: «ليش الأفضل اني اشتري سلمون نرويجي؟»
  After:  «لماذا يُعدّ السلمون النرويجي خيارًا مميّزًا؟»
- Before: «المشترين المحترفين»
  After:  «المشترين التجاريين» / «المشترين في قطاع الأعمال»
- Before: «الاستزراع المائي يضمن إمداداً منتظماً طول العام.»
  After:  «يساعد الاستزراع المنظّم على توفير المنتج بصورة مستقرة على مدار العام.»
