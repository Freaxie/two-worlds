export type ConceptId =
  | 'intelligible'
  | 'forms'
  | 'participation'
  | 'particulars'
  | 'hierarchy'
  | 'substance'
  | 'form'
  | 'matter'
  | 'accidents'
  | 'actuality'
  | 'potentiality'

export type Concept = {
  id: ConceptId
  who: 'plato' | 'aris'
  name: string
  greek: string
  translit: string
  definition: string
  significance: string
  link: ConceptId
  relation: string
  sources: string
}

export const CONCEPTS: Concept[] = [
  {
    id: 'forms',
    who: 'plato',
    name: 'Forms',
    greek: 'εἴδη · ἰδέαι',
    translit: 'eidē, ideai',
    definition:
      'The Beautiful itself, the Just itself, the Equal itself: each is purely and changelessly what it is, and is grasped by thought, not by the senses.',
    significance:
      'Forms answer two questions at once. They are what knowledge is about, since only the stable can be known, and they explain why many different things can share one character.',
    link: 'form',
    relation:
      'Aristotle keeps the word eidos but relocates it. The form of a horse is not a separate Horse-itself; it exists in individual horses as what makes each one a horse.',
    sources: 'Phaedo 74a–75d, 100b–e · Republic V 476a–480a · Symposium 211a–b',
  },
  {
    id: 'participation',
    who: 'plato',
    name: 'Participation',
    greek: 'μέθεξις',
    translit: 'methexis',
    definition:
      'The relation by which a sensible thing has a character: a thing is beautiful because it participates in the Beautiful. Plato also calls it resemblance, or presence, or imitation.',
    significance:
      'It connects the two orders of reality without collapsing them. Plato never gives it a settled analysis, and he says so.',
    link: 'substance',
    relation:
      'Aristotle thinks participation explains nothing: to call Forms patterns that other things share in is "empty words and poetical metaphors." He replaces it with form actually present in matter.',
    sources: 'Phaedo 100c–d · Parmenides 130e–135c (Plato’s own objections) · Aristotle, Metaphysics A.9 991a20–22',
  },
  {
    id: 'particulars',
    who: 'plato',
    name: 'Sensible particulars',
    greek: 'τὰ αἰσθητά',
    translit: 'ta aisthēta',
    definition:
      'The perceptible things around us. They come to be and pass away, and each one is F and in some respect not-F: a stick equal to one thing is unequal to another.',
    significance:
      'They are not illusions. They are real in a lesser, borrowed way, and they can prompt us to recall what they imperfectly exhibit.',
    link: 'substance',
    relation:
      'For Aristotle these very individuals are primary substances, the most basic beings there are. Where Plato sees borrowed reality, Aristotle sees the paradigm of being.',
    sources: 'Phaedo 74b–c · Republic VII 523b–524d · Timaeus 27d–28a',
  },
  {
    id: 'hierarchy',
    who: 'plato',
    name: 'Hierarchy of being',
    greek: 'τὸ μᾶλλον ὄν',
    translit: 'to mallon on, “what is more”',
    definition:
      'Things can be more or less real. The Forms are more than their images, and the Form of the Good, "beyond being," is the source of the Forms’ being and knowability.',
    significance:
      'It makes ethics and metaphysics one project: to know more is to turn toward what is more real and better. Later Platonists turned the gradation into a full system of emanation.',
    link: 'actuality',
    relation:
      'Aristotle has a ranking too, but it runs through actuality. The unmoved mover is pure actuality, thought thinking itself; lesser things are ordered by how fully they realise their natures.',
    sources: 'Republic VI 509b, VII 515d · Sophist 248e–249a · Aristotle, Metaphysics Λ.7, 9',
  },
  {
    id: 'intelligible',
    who: 'plato',
    name: 'The intelligible realm',
    greek: 'τὸ νοητόν',
    translit: 'to noēton',
    definition:
      'The domain of what can be grasped only by intellect (nous), set against the visible (horaton). The Sun, the Line and the Cave in the Republic are three images of the divide.',
    significance:
      'It gives mathematics and philosophy their objects, and education its direction: a turning of the whole soul from becoming toward being.',
    link: 'actuality',
    relation:
      'Aristotle has no separate realm of intelligibles, though he does hold that intellect in act is one with its object, and that the first mover is intellect without matter.',
    sources: 'Republic VI 507b–511e, VII 514a–518d · Aristotle, De Anima III.4–5 · Metaphysics Λ.9',
  },
  {
    id: 'substance',
    who: 'aris',
    name: 'Substance',
    greek: 'οὐσία',
    translit: 'ousia, “beinghood”',
    definition:
      'That which is in the primary sense: what exists in its own right, not as a feature of something else. In the Categories it is the individual: this man, this horse.',
    significance:
      'Every other kind of being (quality, quantity, place, time) is the being of a substance. The question "what is being?" therefore becomes "what is substance?"',
    link: 'particulars',
    relation:
      'Aristotle places at the centre of reality exactly what Plato ranks as derivative: the perceptible individual, now understood through the form that is in it.',
    sources: 'Categories 5, 2a11–14 · Metaphysics Z.1, 1028b2–4',
  },
  {
    id: 'form',
    who: 'aris',
    name: 'Form',
    greek: 'εἶδος · μορφή',
    translit: 'eidos, morphē',
    definition:
      'What makes some matter into a thing of a certain kind: the organisation and essence, "what it is to be" that thing. In living things the form is the soul.',
    significance:
      'Form is the principle of both being and knowledge. To know a thing scientifically is to grasp its form, and in Metaphysics Z Aristotle argues form is substance in the primary sense.',
    link: 'forms',
    relation:
      'Aristotle accepts Plato’s insight that the knowable is the form, but denies that forms of sensible things exist apart. The form of man is always the form of some men.',
    sources: 'Physics II.1 193a28–b12 · Metaphysics Z.7–8, Z.17 · De Anima II.1',
  },
  {
    id: 'matter',
    who: 'aris',
    name: 'Matter',
    greek: 'ὕλη',
    translit: 'hylē, literally “timber”',
    definition:
      'That out of which a thing comes to be and which persists through the change: the bronze of a statue, the bricks of a house, flesh and bone for an animal.',
    significance:
      'Matter is relative. Bricks are matter for a house but are themselves clay formed into bricks. It is what makes change possible, and why natural science cannot ignore the physical.',
    link: 'particulars',
    relation:
      'Plato’s Timaeus has something like it, the "receptacle" (chōra) in which images of the Forms appear. Aristotle himself identifies the two, though scholars debate the equation.',
    sources: 'Physics I.7, II.3 194b24 · Metaphysics Z.3, H.4 · Plato, Timaeus 48e–52d',
  },
  {
    id: 'accidents',
    who: 'aris',
    name: 'Accidents',
    greek: 'τὰ συμβεβηκότα',
    translit: 'ta symbebēkota',
    definition:
      'Features a substance has but could lack while remaining what it is: Socrates being pale, seated, in the Lyceum. The categories list their kinds, such as quality, quantity, relation and place.',
    significance:
      'The distinction lets Aristotle say that a thing changes while staying the same thing, and separates what science studies (the essential) from the incidental.',
    link: 'particulars',
    relation:
      'Where Plato sees sensibles as unstable mixtures of opposites, Aristotle sorts the mixture: a stable essence carrying changeable accidents.',
    sources: 'Categories 2, 4 · Topics I.5 102b4–7 · Metaphysics Δ.30',
  },
  {
    id: 'actuality',
    who: 'aris',
    name: 'Actuality',
    greek: 'ἐνέργεια · ἐντελέχεια',
    translit: 'energeia, entelecheia',
    definition:
      'Being-at-work: a capacity exercised or fulfilled. Seeing, as against being able to see; the oak, as against the acorn.',
    significance:
      'Actuality is prior to potentiality in account, in time and in being. At the top of the cosmos stands a mover that is pure actuality, with no unrealised potential at all.',
    link: 'hierarchy',
    relation:
      'This is Aristotle’s ranking of reality: things differ in how fully they are at work as what they are, not in how closely they copy a separate original.',
    sources: 'Metaphysics Θ.6–8 · Λ.6–7 · De Anima II.1',
  },
  {
    id: 'potentiality',
    who: 'aris',
    name: 'Potentiality',
    greek: 'δύναμις',
    translit: 'dynamis',
    definition:
      'A real capacity to be otherwise or to act: the bronze can become a statue, the student can become a geometer. Change is "the actuality of the potential as such."',
    significance:
      'It answers Parmenides’ challenge that nothing can come from what is not. Change goes from what is potentially F to what is actually F, not from nothing.',
    link: 'particulars',
    relation:
      'Plato treats becoming as the mark of the less real. Aristotle makes it intelligible: change is a structured passage from capacity to its fulfilment.',
    sources: 'Physics III.1 201a10–11 · Metaphysics Θ.1–5 · Physics I.8',
  },
]

export const byId = Object.fromEntries(CONCEPTS.map((c) => [c.id, c])) as Record<ConceptId, Concept>
