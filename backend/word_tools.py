# word_tools.py
import os
import time
import pythoncom
import win32com.client as win32

WD_FIND_STOP = 0           # wdFindStop
WD_STORY = 6               # wdStory
WD_ALERTS_NONE = 0
WD_COLOR_PINK = 7          # wdPink

def _open_word(visible=False):
    pythoncom.CoInitialize()
    word = win32.Dispatch("Word.Application")
    word.Visible = bool(visible)
    word.DisplayAlerts = WD_ALERTS_NONE
    # Performance em docs grandes:
    try:
        word.ScreenUpdating = False
    except Exception:
        pass
    return word

def _close_word(word, doc=None):
    try:
        if doc is not None:
            doc.Close(SaveChanges=False)
    except Exception:
        pass
    try:
        word.Quit()
    except Exception:
        pass
    pythoncom.CoUninitialize()

def _find_and_highlight_all(doc, phrase, whole_word=False, match_case=False):
    """
    Procura todas as ocorrências de 'phrase' e destaca em rosa (wdPink).
    Usa Range.Find para evitar 'pular' ocorrências.
    """
    start = 0
    end = doc.Content.End

    while start < end:
        rng = doc.Range(Start=start, End=end)
        find = rng.Find
        find.Text = phrase
        find.Forward = True
        find.Wrap = WD_FIND_STOP
        find.MatchWholeWord = whole_word
        find.MatchCase = match_case
        find.MatchWildcards = False

        found = find.Execute()
        if not found:
            break

        # rng agora é a ocorrência encontrada
        try:
            rng.HighlightColorIndex = WD_COLOR_PINK
        except Exception:
            pass

        # Continua a partir do fim da ocorrência
        start = rng.End

def highlight_duplicate_sentences(input_path, output_path, min_len=8, visible=False):
    """
    Recria a lógica da sua macro:
      1) Coleta todas as frases
      2) Ordena
      3) Acha duplicadas (case-insensitive, substring)
      4) Destaca em rosa todas as ocorrências no documento

    min_len: ignora frases muito curtas para evitar falso-positivo.
    """
    assert os.path.exists(input_path), f"Arquivo não encontrado: {input_path}"

    word = _open_word(visible=visible)
    doc = word.Documents.Open(os.path.abspath(input_path))

    try:
        # Coletar frases
        sentences = []
        for i in range(1, doc.Sentences.Count + 1):
            txt = doc.Sentences(i).Text.strip()
            if txt and len(txt) >= min_len:
                sentences.append(txt)

        # Ordenar (case-insensitive)
        sentences.sort(key=lambda s: s.lower())

        # Achar duplicadas (semelhante ao InStr do VBA entre i e i+1)
        duplicates = set()
        for i in range(len(sentences) - 1):
            a = sentences[i].lower()
            b = sentences[i + 1].lower()
            if a and a in b:
                duplicates.add(sentences[i])

        # Destacar cada duplicata no documento
        for phrase in duplicates:
            _find_and_highlight_all(doc, phrase, whole_word=False, match_case=False)

        # Salvar
        doc.SaveAs(os.path.abspath(output_path))
    finally:
        _close_word(word, doc)
