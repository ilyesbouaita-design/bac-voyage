// The 15 exercise types
export type ExerciseType =
  | "drag_drop"        // Put words in correct order
  | "qcm"              // Multiple choice + optional timer
  | "click_paste"      // Fill gaps from word bank
  | "categorize"       // Drop items into groups
  | "match_arrows"     // Draw lines between matching pairs
  | "fill_gaps"        // Type answers into blanks
  | "hangman"          // Guess the word
  | "match_picture"    // Match images to words
  | "memory"           // Flip card pairs
  | "flashcard"        // Swipe carousel
  | "sentence_builder" // Tap words to build sentence
  | "speed_quiz"       // Rapid fire questions
  | "word_search"      // Find words in grid
  | "crossword"        // Crossword puzzle
  | "spelling_bee";    // Hear/see word, spell it

// The 4 media types
export type MediaType = "youtube" | "image" | "audio" | "pdf";

// A content block is either an exercise or media
export type ContentBlockType = ExerciseType | MediaType;

// Content block definition (what admin creates)
export interface ContentBlock {
  id: string;
  unit_id: string;
  type: ContentBlockType;
  order_index: number;
  title_fr: string;
  title_ar?: string;
  title_de?: string;
  content: any; // Type-specific JSON — see below
  points?: number; // Only for exercises
  timer_seconds?: number; // Optional timer (QCM, Speed Quiz)
  is_published: boolean;
  created_at: string;
}

// Exercise-specific content shapes
export interface DragDropContent {
  instruction_fr: string;
  instruction_ar?: string;
  sentences: Array<{
    words_correct_order: string[]; // The correct order
    hint_fr?: string;
  }>;
}

export interface QcmContent {
  instruction_fr: string;
  instruction_ar?: string;
  questions: Array<{
    question_fr: string;
    question_ar?: string;
    question_de?: string;
    options: Array<{ text: string; is_correct: boolean }>;
    explanation_fr?: string;
    explanation_ar?: string;
  }>;
  timer_seconds?: number; // Per-question timer, 0 = no timer
}

export interface ClickPasteContent {
  instruction_fr: string;
  instruction_ar?: string;
  sentences: Array<{
    text: string; // Full sentence with the word
    blank_word: string; // Word to blank out
  }>;
}

export interface CategorizeContent {
  instruction_fr: string;
  instruction_ar?: string;
  categories: Array<{
    name_fr: string;
    name_ar?: string;
    name_de?: string;
    color: string; // hex color
  }>;
  items: Array<{
    text: string;
    correct_category: number; // index into categories
  }>;
}

export interface MatchArrowsContent {
  instruction_fr: string;
  instruction_ar?: string;
  pairs: Array<{
    left: string;
    right: string;
  }>;
}

export interface FillGapsContent {
  instruction_fr: string;
  instruction_ar?: string;
  sentences: Array<{
    template: string; // "Der Hund [ist] sehr groß." brackets = gap
    hint?: string;
  }>;
}

export interface HangmanContent {
  instruction_fr: string;
  instruction_ar?: string;
  words: Array<{
    word: string;
    hint_fr: string;
    hint_ar?: string;
    category?: string;
  }>;
}

export interface MatchPictureContent {
  instruction_fr: string;
  instruction_ar?: string;
  pairs: Array<{
    image_url: string;
    word: string;
    word_ar?: string;
  }>;
}

export interface MemoryContent {
  instruction_fr: string;
  instruction_ar?: string;
  pairs: Array<{
    card_a: string; // e.g., German word
    card_b: string; // e.g., French/Arabic translation
  }>;
}

export interface FlashcardContent {
  instruction_fr: string;
  instruction_ar?: string;
  cards: Array<{
    front: string; // German word/phrase
    back: string;  // Translation or definition
    image_url?: string;
    audio_url?: string;
    example_de?: string;
  }>;
}

export interface SentenceBuilderContent {
  instruction_fr: string;
  instruction_ar?: string;
  sentences: Array<{
    correct_sentence: string; // "Der Hund ist groß"
    extra_words?: string[];  // Distractors
  }>;
}

export interface SpeedQuizContent {
  instruction_fr: string;
  instruction_ar?: string;
  questions: Array<{
    question: string;
    correct_answer: string;
    wrong_answers: string[]; // 2-3 wrong options
  }>;
  seconds_per_question: number; // Default 10
}

export interface WordSearchContent {
  instruction_fr: string;
  instruction_ar?: string;
  words: string[];
  grid_size: number; // e.g., 10 for 10x10
}

export interface CrosswordContent {
  instruction_fr: string;
  instruction_ar?: string;
  entries: Array<{
    word: string;
    clue_fr: string;
    clue_ar?: string;
    direction: "across" | "down";
    row: number;
    col: number;
  }>;
}

export interface SpellingBeeContent {
  instruction_fr: string;
  instruction_ar?: string;
  words: Array<{
    word: string;
    hint_fr: string;
    hint_ar?: string;
    audio_url?: string;
  }>;
}

// Media content shapes
export interface YoutubeContent {
  video_url: string;
  title_fr?: string;
  title_ar?: string;
  description_fr?: string;
}

export interface ImageContent {
  images: Array<{
    url: string;
    caption_fr?: string;
    caption_ar?: string;
  }>;
}

export interface AudioContent {
  audio_url: string;
  title_fr?: string;
  title_ar?: string;
  transcript_de?: string;
}

export interface PdfContent {
  pdf_url: string;
  title_fr?: string;
  title_ar?: string;
}

// Union type for all content
export type BlockContent =
  | DragDropContent | QcmContent | ClickPasteContent | CategorizeContent
  | MatchArrowsContent | FillGapsContent | HangmanContent | MatchPictureContent
  | MemoryContent | FlashcardContent | SentenceBuilderContent | SpeedQuizContent
  | WordSearchContent | CrosswordContent | SpellingBeeContent
  | YoutubeContent | ImageContent | AudioContent | PdfContent;

// Learning unit
export interface LearningUnit {
  id: string;
  section: "grammatik" | "wortschatz";
  title_fr: string;
  title_ar?: string;
  title_de?: string;
  description_fr?: string;
  description_ar?: string;
  icon?: string;
  color: string;
  order_index: number;
  einheit_id?: string; // For wortschatz: links to einheit-01..06
  is_published: boolean;
  blocks: ContentBlock[];
}

// Student progress per block
export interface BlockProgress {
  block_id: string;
  student_id: string;
  completed: boolean;
  score: number;     // 0-100 percentage
  attempts: number;
  best_score: number;
  completed_at?: string;
}

// Progress utilities
export const UNLOCK_THRESHOLD = 70; // 70% to unlock next

export function isBlockUnlocked(
  blockIndex: number,
  progresses: BlockProgress[],
  blocks: ContentBlock[],
): boolean {
  if (blockIndex === 0) return true; // First block always unlocked
  // Media blocks don't need scoring — just viewed
  const prevBlock = blocks[blockIndex - 1];
  if (!prevBlock) return true;
  const isMedia = ["youtube", "image", "audio", "pdf"].includes(prevBlock.type);
  if (isMedia) {
    // Media just needs to be marked as viewed
    const prog = progresses.find((p) => p.block_id === prevBlock.id);
    return prog?.completed ?? false;
  }
  // Exercise needs 70%
  const prog = progresses.find((p) => p.block_id === prevBlock.id);
  return (prog?.best_score ?? 0) >= UNLOCK_THRESHOLD;
}

// Content block metadata for the picker UI
export interface BlockTypeInfo {
  type: ContentBlockType;
  label_fr: string;
  label_ar: string;
  icon: string;
  category: "exercise" | "media";
  color: string;
}

export const BLOCK_TYPES: BlockTypeInfo[] = [
  // Exercises
  { type: "drag_drop", label_fr: "Glisser-déposer (ordre des mots)", label_ar: "سحب وإفلات (ترتيب الكلمات)", icon: "↕️", category: "exercise", color: "#6C4CE0" },
  { type: "qcm", label_fr: "QCM + Chronomètre", label_ar: "اختيار من متعدد + مؤقت", icon: "✅", category: "exercise", color: "#6C4CE0" },
  { type: "click_paste", label_fr: "Cliquer-coller (compléter)", label_ar: "انقر والصق (ملء الفراغات)", icon: "📋", category: "exercise", color: "#6C4CE0" },
  { type: "categorize", label_fr: "Classer par catégorie", label_ar: "تصنيف في مجموعات", icon: "📂", category: "exercise", color: "#FFB200" },
  { type: "match_arrows", label_fr: "Relier (flèches)", label_ar: "ربط بالأسهم", icon: "🔗", category: "exercise", color: "#FFB200" },
  { type: "fill_gaps", label_fr: "Compléter (écrire)", label_ar: "ملء الفراغات (كتابة)", icon: "✏️", category: "exercise", color: "#FFB200" },
  { type: "hangman", label_fr: "Pendu", label_ar: "لعبة المشنقة", icon: "🎯", category: "exercise", color: "#FF5A5F" },
  { type: "match_picture", label_fr: "Associer l'image", label_ar: "مطابقة الصورة", icon: "🖼️", category: "exercise", color: "#FF5A5F" },
  { type: "memory", label_fr: "Jeu de mémoire", label_ar: "لعبة الذاكرة", icon: "🃏", category: "exercise", color: "#FF5A5F" },
  { type: "flashcard", label_fr: "Cartes-éclair", label_ar: "بطاقات تعليمية", icon: "📇", category: "exercise", color: "#0FB6A3" },
  { type: "sentence_builder", label_fr: "Construire une phrase", label_ar: "بناء الجملة", icon: "🧩", category: "exercise", color: "#0FB6A3" },
  { type: "speed_quiz", label_fr: "Quiz rapide", label_ar: "اختبار سريع", icon: "⚡", category: "exercise", color: "#0FB6A3" },
  { type: "word_search", label_fr: "Mots cachés", label_ar: "البحث عن الكلمات", icon: "🔍", category: "exercise", color: "#8B5CF6" },
  { type: "crossword", label_fr: "Mots croisés", label_ar: "كلمات متقاطعة", icon: "📝", category: "exercise", color: "#8B5CF6" },
  { type: "spelling_bee", label_fr: "Épeler le mot", label_ar: "تهجئة الكلمة", icon: "🐝", category: "exercise", color: "#8B5CF6" },
  // Media
  { type: "youtube", label_fr: "Vidéo YouTube", label_ar: "فيديو يوتيوب", icon: "📹", category: "media", color: "#FF0000" },
  { type: "image", label_fr: "Image / Galerie", label_ar: "صورة / معرض", icon: "🖼️", category: "media", color: "#16a34a" },
  { type: "audio", label_fr: "Audio", label_ar: "صوت", icon: "🔊", category: "media", color: "#16a34a" },
  { type: "pdf", label_fr: "Document PDF", label_ar: "مستند PDF", icon: "📄", category: "media", color: "#16a34a" },
];
