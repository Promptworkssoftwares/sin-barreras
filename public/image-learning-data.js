// Stable image IDs keep translations, quizzes and progress aligned in every language.
export const IMAGE_LESSONS = Object.freeze([
  { id: 'everyday', image: '/assets/learn/everyday.png', word: 'conversation', phrase: 'Can we talk for a moment?' },
  { id: 'work', image: '/assets/learn/work.png', word: 'work', phrase: 'I am ready to work.' },
  { id: 'construction', image: '/assets/learn/construction.png', word: 'construction', phrase: 'Where are the safety tools?' },
  { id: 'medical', image: '/assets/learn/medical.png', word: 'health', phrase: 'I need to see a doctor.' },
  { id: 'shopping', image: '/assets/learn/shopping.png', word: 'shopping', phrase: 'How much does this cost?' },
  { id: 'restaurant', image: '/assets/learn/restaurant.png', word: 'restaurant', phrase: 'May I see the menu?' },
  { id: 'interview', image: '/assets/learn/interview.png', word: 'job interview', phrase: 'I have experience in this work.' },
  { id: 'school', image: '/assets/learn/school.png', word: 'school', phrase: 'When does the class start?' }
]);

export const PRONOUN_CATEGORIES = Object.freeze([
  { id: 'personal', label: 'Personales', description: 'Quién realiza la acción.' },
  { id: 'object', label: 'De objeto', description: 'Quién recibe la acción.' },
  { id: 'possessive', label: 'Posesivos', description: 'A quién pertenece algo.' },
  { id: 'reflexive', label: 'Reflexivos', description: 'La acción vuelve a la misma persona.' },
  { id: 'indefinite', label: 'Indefinidos', description: 'Personas sin identificar.' },
  { id: 'reciprocal', label: 'Recíprocos', description: 'Acción mutua entre personas.' },
  { id: 'demonstrative', label: 'Demostrativos · extra', description: 'Señala algo cercano o distante.' }
]);

const pronoun = (id, category, word, phrase, grammar, imageVariants = []) => ({
  id, category, word, phrase, grammar,
  image: `/assets/learn/pronouns/${id}.webp`, imageVariants
});

export const PRONOUN_LESSONS = Object.freeze([
  pronoun('i', 'personal', 'I', 'I am here.', 'subject pronoun, first person singular'),
  pronoun('you', 'personal', 'you', 'You are here.', 'subject pronoun, second person; singular or plural'),
  pronoun('he', 'personal', 'he', 'He is here.', 'subject pronoun, masculine'),
  pronoun('she', 'personal', 'she', 'She is here.', 'subject pronoun, feminine'),
  pronoun('it', 'personal', 'it', 'It is here.', 'subject pronoun referring to an animal or object'),
  pronoun('we', 'personal', 'we', 'We are here.', 'subject pronoun, first person plural'),
  pronoun('me', 'object', 'me', 'She sees me.', 'object pronoun, first person singular'),
  pronoun('him', 'object', 'him', 'I see him.', 'object pronoun, masculine'),
  pronoun('her', 'object', 'her', 'I see her.', 'object pronoun, feminine; NOT possessive determiner'),
  pronoun('us', 'object', 'us', 'She sees us.', 'object pronoun, first person plural'),
  pronoun('them', 'object', 'them', 'I see them.', 'object pronoun, third person plural'),
  pronoun('my', 'possessive', 'my', 'This is my bag.', 'possessive determiner before a noun'),
  pronoun('his', 'possessive', 'his', 'That is his bag.', 'possessive determiner before a noun'),
  pronoun('its', 'possessive', 'its', 'The dog has its ball.', 'possessive determiner before a noun'),
  pronoun('mine', 'possessive', 'mine', 'This bag is mine.', 'independent possessive pronoun'),
  pronoun('hers', 'possessive', 'hers', 'This bag is hers.', 'independent possessive pronoun'),
  pronoun('ours', 'possessive', 'ours', 'This bag is ours.', 'independent possessive pronoun'),
  pronoun('yours', 'possessive', 'yours', 'This bag is yours.', 'independent possessive pronoun'),
  pronoun('theirs', 'possessive', 'theirs', 'This bag is theirs.', 'independent possessive pronoun'),
  pronoun('myself', 'reflexive', 'myself', 'I did it myself.', 'reflexive or emphatic pronoun, first person singular'),
  pronoun('yourself', 'reflexive', 'yourself', 'You did it yourself.', 'reflexive or emphatic pronoun, second person singular'),
  pronoun('himself', 'reflexive', 'himself', 'He did it himself.', 'reflexive or emphatic pronoun, masculine'),
  pronoun('herself', 'reflexive', 'herself', 'She did it herself.', 'reflexive or emphatic pronoun, feminine'),
  pronoun('ourselves', 'reflexive', 'ourselves', 'We did it ourselves.', 'reflexive or emphatic pronoun, first person plural'),
  pronoun('themselves', 'reflexive', 'themselves', 'They did it themselves.', 'reflexive or emphatic pronoun, third person plural'),
  pronoun('someone', 'indefinite', 'someone / somebody', 'Someone is here.', 'indefinite pronoun for an unspecified person'),
  pronoun('anyone', 'indefinite', 'anyone / anybody', 'Did anyone call?', 'indefinite pronoun in a question'),
  pronoun('everyone', 'indefinite', 'everyone / everybody', 'Everyone is here.', 'indefinite pronoun for all people'),
  pronoun('no-one', 'indefinite', 'no one / nobody', 'No one is here.', 'negative indefinite pronoun for no person'),
  pronoun('each-other', 'reciprocal', 'each other', 'They help each other.', 'reciprocal pronoun, mutual action'),
  pronoun('this', 'demonstrative', 'this', 'This puppy is friendly.', 'singular demonstrative for something near the speaker', ['/assets/learn/pronouns/this-apples.webp']),
  pronoun('that', 'demonstrative', 'that', 'That tree is far away.', 'singular demonstrative for something farther away'),
  pronoun('these', 'demonstrative', 'these', 'These apples are fresh.', 'plural demonstrative for things near the speaker')
]);

export const FAMILY_CATEGORIES = Object.freeze([
  { id: 'immediate', label: 'Familia cercana', description: 'Personas del núcleo familiar.' },
  { id: 'everyday', label: 'Trato cotidiano', description: 'Hermanos y nombres familiares.' },
  { id: 'relatives', label: 'Parientes', description: 'Abuelos, tíos y primos.' },
  { id: 'couple', label: 'Pareja', description: 'Esposo y esposa.' }
]);

const family = (slug, category, word, phrase, grammar = '') => ({
  id: `family-${slug}`, category, word, phrase, grammar,
  image: `/assets/learn/family/${slug}.webp`
});

export const FAMILY_LESSONS = Object.freeze([
  family('family', 'immediate', 'family', 'I love my family.'),
  family('parents', 'immediate', 'parents', 'My parents are here.', 'mother and father together'),
  family('mother', 'immediate', 'mother', 'This is my mother.', 'formal or neutral mother'),
  family('father', 'immediate', 'father', 'This is my father.', 'formal or neutral father'),
  family('son', 'immediate', 'son', 'This is my son.'),
  family('daughter', 'immediate', 'daughter', 'This is my daughter.'),
  family('baby', 'immediate', 'baby', 'The baby is sleeping.'),
  family('brother', 'everyday', 'brother', 'My brother is here.'),
  family('sister', 'everyday', 'sister', 'My sister is here.'),
  family('mom', 'everyday', 'mom', 'My mom is here.', 'affectionate informal mother'),
  family('dad', 'everyday', 'dad', 'My dad is here.', 'affectionate informal father'),
  family('grandfather', 'relatives', 'grandfather / grandpa', 'My grandfather is here.', 'grandfather; grandpa is an informal variant'),
  family('grandmother', 'relatives', 'grandmother / grandma', 'My grandmother is here.', 'grandmother; grandma is an informal variant'),
  family('grandparents', 'relatives', 'grandparents', 'My grandparents are here.'),
  family('aunt', 'relatives', 'aunt', 'This is my aunt.'),
  family('uncle', 'relatives', 'uncle', 'This is my uncle.'),
  family('cousin', 'relatives', 'cousin', 'My cousin is here.', 'gender-neutral in English; preserve natural grammar in target language'),
  family('husband', 'couple', 'husband', 'This is my husband.'),
  family('wife', 'couple', 'wife', 'This is my wife.')
]);

// Every topic owns its own numbered levels. Add later levels here when their images arrive.
export const IMAGE_TOPICS = Object.freeze([
  { id: 'pronouns', label: 'Pronombres', description: 'Personas, posesión y referencias', levels: [{ id: '1', label: 'Fundamentos', categories: PRONOUN_CATEGORIES }], planned: ['Uso en frases', 'Contrastes', 'Conversaciones'] },
  { id: 'family', label: 'Familia', description: 'Personas y parentescos', levels: [{ id: '1', label: 'Mi familia', categories: FAMILY_CATEGORIES }], planned: ['Relaciones', 'Descripciones', 'Conversaciones'] },
  { id: 'situations', label: 'Situaciones', description: 'Vocabulario de la vida diaria', levels: [{ id: '1', label: 'Vida diaria', categories: [] }], planned: ['Más contextos', 'Resolver situaciones', 'Conversaciones'] }
]);

export function imageTopicItems(topic) {
  if (topic === 'pronouns') return PRONOUN_LESSONS;
  if (topic === 'family') return FAMILY_LESSONS;
  if (topic === 'situations') return IMAGE_LESSONS;
  return null;
}

export function imageLessonGroup(topic = 'pronouns', level = '1', category = 'personal') {
  const definition = IMAGE_TOPICS.find((entry) => entry.id === topic)?.levels.find((entry) => entry.id === level);
  if (!definition) return null;
  if (!definition.categories.length) return category === 'all' ? imageTopicItems(topic).filter((item) => (item.level || '1') === level) : null;
  if (!definition.categories.some((entry) => entry.id === category)) return null;
  return imageTopicItems(topic).filter((item) => (item.level || '1') === level && item.category === category);
}

// Audio and transcription are offered only for languages listed by the speech provider.
// The visual/text lesson still works for every language in the application catalog.
export const IMAGE_AUDIO_LANGUAGES = new Set('af ar hy az be bs bg ca zh hr cs da nl en et fi fr gl de el he hi hu is id it ja kn kk ko lv lt mk ms mr mi ne no fa pl pt ro ru sr sk sl es sw sv tl ta th tr uk ur vi cy'.split(' '));
