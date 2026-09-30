import { IMAGE_TOPICS, imageTopicItems, imageLessonGroup, IMAGE_AUDIO_LANGUAGES, imageNeedsLatinReading } from './image-learning-data.js?v=1.7.19';
import { LANGUAGE_CATALOG } from './languages.js?v=1.7.19';

const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

function shuffle(values) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

export function initImageLearning({ request, speakText, notify, getNativeLanguage, onPractice, onCorrect, getProgress } = {}) {
  const ui = {
    native: $('#image-native-language'), target: $('#image-target-language'), load: $('#image-load'),
    topics: $('#image-topic-picker'), levels: $('#image-level-picker'), categories: $('#image-category-picker'),
    eyebrow: $('#image-learning-eyebrow'), title: $('#image-learning-title'), description: $('#image-learning-description'),
    status: $('#image-learning-status'), cards: $('#image-learning-cards'), start: $('#image-start-quiz'),
    quiz: $('#image-learning-quiz'), word: $('#image-quiz-word'), progress: $('#image-quiz-progress'),
    options: $('#image-quiz-options'), feedback: $('#image-quiz-feedback'), next: $('#image-quiz-next')
  };
  if (!ui.native || !ui.target) return { open() {} };

  const languageOptions = LANGUAGE_CATALOG.map(({ code, label }) => `<option value="${escapeHtml(code)}">${escapeHtml(label)}</option>`).join('');
  ui.native.innerHTML = languageOptions;
  ui.target.innerHTML = languageOptions;
  const native = getNativeLanguage?.() || 'es';
  ui.native.value = LANGUAGE_CATALOG.some((entry) => entry.code === native) ? native : 'es';
  ui.target.value = ui.native.value === 'en' ? 'es' : 'en';

  let items = [];
  let topic = 'pronouns';
  let level = '1';
  let category = 'personal';
  let selection = '';
  let questions = [];
  let index = 0;
  let answered = false;
  const cached = new Map();
  const selectedKey = () => `${ui.native.value}:${ui.target.value}:${topic}:${level}:${category}`;

  function renderNavigation() {
    const currentTopic = IMAGE_TOPICS.find((entry) => entry.id === topic);
    const currentLevel = currentTopic.levels.find((entry) => entry.id === level);
    const completed = new Set(getProgress?.(ui.target.value) || []);
    const progressCount = (concepts) => concepts.filter((item) => completed.has(`${ui.target.value}:${item.id}`)).length;
    const levelConcepts = (number) => imageTopicItems(topic).filter((item) => (item.level || '1') === String(number));
    ui.topics.innerHTML = IMAGE_TOPICS.map((entry) => {
      const concepts = imageTopicItems(entry.id);
      return `<button type="button" data-image-topic="${entry.id}" aria-pressed="${topic === entry.id}"><strong>${escapeHtml(entry.label)}</strong><span>${escapeHtml(entry.description)}</span><small>${progressCount(concepts)}/${concepts.length} imágenes practicadas</small></button>`;
    }).join('');
    ui.levels.innerHTML = [1, 2, 3, 4].map((number) => {
      const entry = currentTopic.levels.find((item) => item.id === String(number));
      return `<button type="button" data-image-level="${number}" aria-pressed="${level === String(number)}" ${entry ? '' : 'disabled'}><small>NIVEL ${number}</small><strong>${escapeHtml(entry?.label || currentTopic.planned[number - 2])}</strong><span>${entry ? `${progressCount(levelConcepts(number))}/${levelConcepts(number).length} imágenes practicadas` : 'Próximamente · sin imágenes todavía'}</span></button>`;
    }).join('');
    ui.eyebrow.textContent = `${currentTopic.label.toUpperCase()} · NIVEL ${level}`;
    ui.title.innerHTML = `Aprende ${escapeHtml(currentTopic.label.toLowerCase())} con <em>imágenes.</em>`;
    ui.description.textContent = `Explora ${currentLevel.label.toLowerCase()}, escucha los ejemplos y luego reconoce cada imagen.`;
    ui.categories.hidden = !currentLevel.categories.length;
    ui.categories.innerHTML = currentLevel.categories.map((entry) => {
      const concepts = imageLessonGroup(topic, level, entry.id);
      const count = concepts.filter((item) => completed.has(`${ui.target.value}:${item.id}`)).length;
      return `<button type="button" data-image-category="${entry.id}" aria-pressed="${category === entry.id}"><strong>${escapeHtml(entry.label)}</strong><span>${escapeHtml(entry.description)}</span><small>${count}/${concepts.length}</small></button>`;
    }).join('');
  }

  function invalidate() {
    items = [];
    selection = '';
    questions = [];
    ui.cards.innerHTML = (imageLessonGroup(topic, level, category) || []).map((item, position) => `
      <article class="image-learning-preview">
        <div class="image-learning-picture${item.imageVariants?.length ? ' has-variants' : ''}"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.word)}" loading="lazy">${(item.imageVariants || []).map((src) => `<img class="image-variant" src="${escapeHtml(src)}" alt="Otro ejemplo de ${escapeHtml(item.word)}" loading="lazy">`).join('')}</div>
        <strong>Imagen ${position + 1} · prepara la traducción</strong>
      </article>`).join('');
    ui.quiz.classList.add('is-hidden');
    ui.start.hidden = true;
    ui.start.textContent = 'Practicar con imágenes →';
    ui.status.textContent = 'Toca “Preparar categoría” para cargar estas imágenes.';
  }

  function languageChanged(changed) {
    if (ui.native.value === ui.target.value) {
      if (changed === 'native') ui.target.value = ui.native.value === 'en' ? 'es' : 'en';
      else ui.native.value = ui.target.value === 'es' ? 'en' : 'es';
    }
    invalidate();
    renderNavigation();
  }

  function renderCards() {
    const progress = new Set(getProgress?.(ui.target.value) || []);
    const completed = items.filter((item) => progress.has(`${ui.target.value}:${item.id}`)).length;
    const audioAvailable = IMAGE_AUDIO_LANGUAGES.has(ui.target.value);
    ui.status.textContent = `${items.length} imágenes listas · ${completed} practicadas en ${ui.target.selectedOptions[0]?.textContent || 'este idioma'}.${audioAvailable ? '' : ' Este idioma ofrece aprendizaje visual y texto; la voz no está disponible.'}`;
    const needsReading = imageNeedsLatinReading(ui.target.value);
    ui.cards.innerHTML = items.map((item) => `
      <article class="image-learning-card" data-image-id="${escapeHtml(item.id)}">
        <div class="image-learning-picture${item.imageVariants?.length ? ' has-variants' : ''}"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.nativeWord)}" loading="lazy">${(item.imageVariants || []).map((src) => `<img class="image-variant" src="${escapeHtml(src)}" alt="Otro ejemplo de ${escapeHtml(item.nativeWord)}" loading="lazy">`).join('')}</div>
        <div class="image-learning-copy"><small>Significa: ${escapeHtml(item.nativeWord)}${topic === 'pronouns' && category === 'possessive' ? ` · ${['my', 'his', 'its'].includes(item.id) ? 'acompaña un nombre' : 'reemplaza un nombre'}` : ''}</small>
          ${needsReading ? '<span class="image-reading-label">ASÍ SE LEE · LETRAS LATINAS</span>' : ''}
          <h4 lang="${needsReading ? escapeHtml(ui.native.value) : escapeHtml(ui.target.value)}">${escapeHtml(needsReading ? item.targetWordLatin : item.targetWord)}</h4>
          <p lang="${needsReading ? escapeHtml(ui.native.value) : escapeHtml(ui.target.value)}">${escapeHtml(needsReading ? item.targetPhraseLatin : item.targetPhrase)}</p>
          <span>${escapeHtml(item.nativePhrase)}</span>
          ${needsReading ? `<details class="image-learning-original"><summary>Ver escritura original</summary><p lang="${escapeHtml(ui.target.value)}" dir="auto">${escapeHtml(item.targetWord)}</p><p lang="${escapeHtml(ui.target.value)}" dir="auto">${escapeHtml(item.targetPhrase)}</p></details>` : ''}</div>
        <div class="image-learning-actions">
          ${audioAvailable ? `<button type="button" data-image-action="word" aria-label="Escuchar palabra ${escapeHtml(needsReading ? item.targetWordLatin : item.targetWord)}">▶ Palabra</button>
          <button type="button" data-image-action="phrase" aria-label="Escuchar frase ${escapeHtml(needsReading ? item.targetPhraseLatin : item.targetPhrase)}">▶ Frase</button>
          <button type="button" data-image-action="practice">● Practicar mi voz</button>` : '<span class="image-text-only">Práctica visual y de lectura</span>'}
        </div>
      </article>`).join('');
    ui.start.hidden = false;
    renderNavigation();
  }

  async function load() {
    if (ui.load.disabled) return;
    const nativeLanguage = ui.native.value;
    const targetLanguage = ui.target.value;
    if (nativeLanguage === targetLanguage) { notify?.('Selecciona idiomas diferentes.'); return; }
    const key = selectedKey();
    const group = imageLessonGroup(topic, level, category);
    ui.load.disabled = true;
    ui.load.textContent = 'Preparando…';
    ui.status.textContent = 'Preparando palabras y frases para las imágenes…';
    try {
      const result = cached.get(key) || await request('/api/learn/images', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nativeLanguage, targetLanguage, topic, level, category })
      });
      if (!Array.isArray(result.items) || result.items.length !== group.length) throw new Error('La categoría llegó incompleta. Inténtalo de nuevo.');
      cached.set(key, result);
      if (selectedKey() !== key) return;
      items = result.items;
      selection = key;
      ui.quiz.classList.add('is-hidden');
      renderCards();
    } catch (error) {
      ui.status.textContent = error.message || 'No pudimos preparar las imágenes. Inténtalo de nuevo.';
      notify?.(ui.status.textContent);
    } finally {
      ui.load.disabled = false;
      ui.load.textContent = 'Preparar categoría';
    }
  }

  function renderQuestion() {
    const current = questions[index];
    if (!current) {
      ui.quiz.classList.add('is-hidden');
      ui.status.textContent = '¡Terminaste esta categoría! Puedes elegir la siguiente o repetir el reto.';
      ui.start.textContent = 'Repetir reto →';
      return;
    }
    answered = false;
    ui.word.textContent = imageNeedsLatinReading(ui.target.value) ? current.targetWordLatin : current.targetWord;
    ui.word.lang = imageNeedsLatinReading(ui.target.value) ? ui.native.value : ui.target.value;
    ui.progress.textContent = `${index + 1} / ${questions.length}`;
    ui.feedback.textContent = 'Observa las imágenes y elige una.';
    ui.next.hidden = true;
    const distractors = items.length >= 4 ? items : [...items, ...imageTopicItems(topic).map((item) => ({ ...item, nativeWord: item.word }))];
    const choices = shuffle([current, ...shuffle(distractors.filter((item) => item.id !== current.id)).filter((item, position, all) => all.findIndex((other) => other.id === item.id) === position).slice(0, 3)]);
    ui.options.innerHTML = choices.map((item) => `<button type="button" data-image-choice="${escapeHtml(item.id)}" aria-label="${escapeHtml(item.nativeWord)}"><img src="${escapeHtml(item.image)}" alt=""><span>${escapeHtml(item.nativeWord)}</span></button>`).join('');
  }

  ui.native.addEventListener('change', () => languageChanged('native'));
  ui.target.addEventListener('change', () => languageChanged('target'));
  ui.topics.addEventListener('click', (event) => {
    const button = event.target.closest('[data-image-topic]');
    if (!button || button.dataset.imageTopic === topic) return;
    topic = button.dataset.imageTopic;
    level = IMAGE_TOPICS.find((entry) => entry.id === topic).levels[0].id;
    category = IMAGE_TOPICS.find((entry) => entry.id === topic).levels[0].categories[0]?.id || 'all';
    invalidate(); renderNavigation();
  });
  ui.levels.addEventListener('click', (event) => {
    const button = event.target.closest('[data-image-level]');
    if (!button || button.disabled || button.dataset.imageLevel === level) return;
    level = button.dataset.imageLevel;
    category = IMAGE_TOPICS.find((entry) => entry.id === topic).levels.find((entry) => entry.id === level).categories[0]?.id || 'all';
    invalidate(); renderNavigation();
  });
  ui.categories.addEventListener('click', (event) => {
    const button = event.target.closest('[data-image-category]');
    if (!button || button.dataset.imageCategory === category) return;
    category = button.dataset.imageCategory;
    invalidate(); renderNavigation();
  });
  ui.load.addEventListener('click', load);
  ui.cards.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-image-action]');
    const item = items.find((entry) => entry.id === button?.closest('[data-image-id]')?.dataset.imageId);
    if (!item || selection !== selectedKey()) return;
    if (button.dataset.imageAction === 'practice') {
      onPractice?.({ id: `image-${item.id}-${ui.target.value}`, sourceText: item.nativePhrase,
        translatedText: item.targetPhrase, targetReading: item.targetPhraseLatin, fromImage: true, sourceLanguage: ui.native.value,
        targetLanguage: ui.target.value, situation: item.id });
      return;
    }
    const text = button.dataset.imageAction === 'word' ? item.targetWord : item.targetPhrase;
    button.disabled = true;
    try { await speakText?.(text, ui.target.value, { visualTarget: button, visualLabel: 'VOZ AI' }); }
    catch (error) { notify?.(error.message || 'No pudimos reproducir el audio.'); }
    finally { button.disabled = false; }
  });
  ui.start.addEventListener('click', () => {
    if (!items.length || selection !== selectedKey()) return;
    questions = shuffle(items);
    index = 0;
    ui.quiz.classList.remove('is-hidden');
    renderQuestion();
    ui.quiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  ui.options.addEventListener('click', (event) => {
    const button = event.target.closest('[data-image-choice]');
    if (!button || answered) return;
    const current = questions[index];
    if (button.dataset.imageChoice !== current.id) {
      button.classList.add('is-wrong');
      button.disabled = true;
      ui.feedback.textContent = 'Casi. Mira las otras imágenes y vuelve a intentarlo.';
      return;
    }
    answered = true;
    button.classList.add('is-correct');
    ui.options.querySelectorAll('button').forEach((option) => { option.disabled = true; });
    ui.feedback.textContent = `¡Correcto! ${imageNeedsLatinReading(ui.target.value) ? current.targetWordLatin : current.targetWord} significa ${current.nativeWord}.`;
    ui.next.hidden = false;
    if (onCorrect?.(current.id, ui.target.value)) renderCards();
  });
  ui.next.addEventListener('click', () => { if (!answered) return; index += 1; renderQuestion(); });
  renderNavigation();
  invalidate();
  return { open() { if (items.length && selection === selectedKey()) renderCards(); else renderNavigation(); } };
}
