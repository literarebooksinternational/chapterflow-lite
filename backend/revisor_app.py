# revisor_app.py atualizado e corrigido

import io
import os
import re
import json
import tempfile
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from spellchecker import SpellChecker
import diff_match_patch as dmp_module
import pythoncom
import win32com.client as win32
from docx.shared import RGBColor

# Inicializa o Flask
app = Flask(__name__)
CORS(app)

# ======================
# Funções auxiliares
# ======================

spell = SpellChecker()
dmp = dmp_module.diff_match_patch()


def capitalize_sentences(text):
    """Coloca a primeira letra de cada frase em maiúscula"""
    return re.sub(r'(^|(?<=[.!?]\s))([a-z])', lambda m: m.group(1) + m.group(2).upper(), text)


def aplicar_correcoes_local(doc):
    """
    Mantém seu diff original para formatação visual (strike + bold + cores)
    """
    report = []

    todas_regras = {}  # Aqui você pode colocar suas regras de substituição

    for p in doc.paragraphs:
        if not p.text.strip():
            continue

        texto_original = p.text
        texto_corrigido = texto_original

        # Aplica todas as regras
        for pattern, replacement in todas_regras.items():
            texto_corrigido = pattern.sub(replacement, texto_corrigido)

        # Capitalização
        texto_corrigido = capitalize_sentences(texto_corrigido)

        # Correção ortográfica
        palavras = re.findall(r'\b\w+\b', texto_corrigido)
        palavras_erradas = spell.unknown(palavras)
        texto_final = texto_corrigido
        for palavra in palavras_erradas:
            if palavra.isupper() or palavra[0].isupper():
                continue
            correcao = spell.correction(palavra)
            if correcao and correcao != palavra:
                texto_final = re.sub(r'\b' + re.escape(palavra) + r'\b', correcao, texto_final)

        # Limpeza de espaços
        texto_final = re.sub(r'\s{2,}', ' ', texto_final).strip()

        # Formata diferenças com diff_match_patch
        if texto_final != texto_original:
            diffs = dmp.diff_main(texto_original, texto_final)
            dmp.diff_cleanupSemantic(diffs)

            p.clear()
            for op, text in diffs:
                run = p.add_run(text)
                if op == dmp.DIFF_DELETE:
                    run.font.strike = True
                    run.font.color.rgb = RGBColor(255, 0, 0)  # ✅ corrigido
                    report.append({'original': text, 'corrigido': '', 'tipo': 'Remoção'})
                elif op == dmp.DIFF_INSERT:
                    run.font.bold = True
                    run.font.color.rgb = RGBColor(0, 128, 0)  # ✅ corrigido
                    report.append({'original': '', 'corrigido': text, 'tipo': 'Adição'})
                elif op == dmp.DIFF_EQUAL:
                    pass

    return doc, report


# ======================
# Funções Word COM
# ======================

WD_COLOR_PINK = 7
WD_FIND_STOP = 0
WD_ALERTS_NONE = 0


def highlight_duplicate_sentences_com(input_path, output_path, min_len=8, visible=False):
    """
    Detecta frases duplicadas no documento e destaca em rosa.
    """
    pythoncom.CoInitialize()
    word = win32.Dispatch("Word.Application")
    word.Visible = visible
    word.DisplayAlerts = WD_ALERTS_NONE

    doc = word.Documents.Open(os.path.abspath(input_path))
    doc.TrackRevisions = True
    doc.ShowRevisions = True

    try:
        sentences = []
        for i in range(1, doc.Sentences.Count + 1):
            txt = doc.Sentences(i).Text.strip()
            if txt and len(txt) >= min_len:
                sentences.append(txt)

        sentences.sort(key=lambda s: s.lower())
        duplicates = set()
        for i in range(len(sentences) - 1):
            a = sentences[i].lower()
            b = sentences[i + 1].lower()
            if a and a in b:
                duplicates.add(sentences[i])

        # Destacar duplicadas
        for phrase in duplicates:
            start = 0
            end = doc.Content.End
            while start < end:
                rng = doc.Range(Start=start, End=end)
                find = rng.Find
                find.Text = phrase
                find.Forward = True
                find.Wrap = WD_FIND_STOP
                find.MatchWholeWord = False
                find.MatchCase = False
                found = find.Execute()
                if not found:
                    rng = None
                    find = None
                    break
                rng.HighlightColorIndex = WD_COLOR_PINK
                start = rng.End
                rng = None
                find = None

        doc.SaveAs(os.path.abspath(output_path))
    finally:
        if doc:
            doc.Close(False)
            doc = None
        if word:
            word.Quit()
            word = None
        pythoncom.CoUninitialize()


# ======================
# Endpoint Flask
# ======================

@app.route('/revisar-documento', methods=['POST'])
def revisar_documento():
    if 'file' not in request.files:
        return jsonify({"error": "Nenhum arquivo enviado"}), 400

    file = request.files['file']
    if not file or file.filename == '':
        return jsonify({"error": "Nome de arquivo vazio ou inválido"}), 400

    if not file.filename.endswith('.docx'):
        return jsonify({"error": "Formato de arquivo inválido. Por favor, envie um .docx"}), 400

    try:
        # Salvar arquivo temporário
        with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as tmp_input:
            tmp_input.write(file.read())
            tmp_input_path = tmp_input.name

        # Primeiro, aplicar correções locais (diff + spell)
        import docx
        doc = docx.Document(tmp_input_path)
        doc_corrigido, relatorio = aplicar_correcoes_local(doc)

        # Salvar temporário antes de passar para Word COM
        tmp_corrected_path = tmp_input_path.replace(".docx", "_corrigido.docx")
        doc_corrigido.save(tmp_corrected_path)

        # Segundo, aplicar duplicadas via Word COM com Track Changes
        tmp_output_path = tmp_input_path.replace(".docx", "_REVISADO.docx")
        highlight_duplicate_sentences_com(tmp_corrected_path, tmp_output_path, min_len=8, visible=False)

        # Retornar arquivo final
        return send_file(
            tmp_output_path,
            as_attachment=True,
            download_name=f"revisado_{file.filename}",
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )

    except Exception as e:
        return jsonify({"error": f"Erro interno ao processar o arquivo: {str(e)}"}), 500

    finally:
        # Opcional: remover temporários
        try:
            os.remove(tmp_input_path)
            os.remove(tmp_corrected_path)
        except Exception:
            pass


if __name__ == '__main__':
    app.run(debug=True, port=5000)
