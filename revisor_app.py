# revisor_app.py

import io
import re
import json
import docx
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from spellchecker import SpellChecker
from docx.shared import RGBColor

# Importa a nova biblioteca para comparar textos
import diff_match_patch as dmp_module

# Inicializa o aplicativo Flask e o CORS
app = Flask(__name__)
CORS(app)

# --- Dicionários de Correção (inalterados) ---
CACOETES = {
    re.compile(r'\b(Aí|Ai|Aih) eu fui\b', re.IGNORECASE): 'Então eu fui',
    re.compile(r'\b(Aí|Ai|Aih) eu disse\b', re.IGNORECASE): 'Então eu disse',
    re.compile(r'\btipo assim\b', re.IGNORECASE): 'por exemplo',
    re.compile(r'\b(okay|ok)\b', re.IGNORECASE): 'certo',
    re.compile(r'\b(entendeu\?|sacou\?)\b', re.IGNORECASE): '',
    re.compile(r'\b(na real|sabe)\b', re.IGNORECASE): '',
    re.compile(r'\b(então assim)\b', re.IGNORECASE): 'portanto',
    re.compile(r'\b(tá bom|beleza)\b', re.IGNORECASE): 'certo',
}

GIRIAS = {
    re.compile(r'\bnois\b', re.IGNORECASE): 'nós',
    re.compile(r'\btamo\b', re.IGNORECASE): 'estamos',
    re.compile(r'\bta\b', re.IGNORECASE): 'está',
    re.compile(r'\b(vc|vcê)\b', re.IGNORECASE): 'você',
    re.compile(r'\bpra\b', re.IGNORECASE): 'para',
    re.compile(r'\bpros?\b', re.IGNORECASE): 'para os',
    re.compile(r'\bnéh?\b', re.IGNORECASE): '',
    re.compile(r'\bblz\b', re.IGNORECASE): 'certo',
    re.compile(r'\b(kkk+|rsrs)\b', re.IGNORECASE): '',
    re.compile(r'\bpq\b', re.IGNORECASE): 'porque',
    re.compile(r'\b(q|qui)\b', re.IGNORECASE): 'que',
    re.compile(r'\bmano\b', re.IGNORECASE): 'amigo',
    re.compile(r'\btbm\b', re.IGNORECASE): 'também',
}

# Configura o corretor ortográfico
spell = SpellChecker(language='pt')

def aplicar_correcoes_com_diff(doc):
    """
    NOVA VERSÃO DA FUNÇÃO PRINCIPAL.
    Esta função aplica as correções e reconstrói o parágrafo mostrando as
    diferenças (diffs) com formatação especial (riscado/vermelho, negrito/verde).
    Isso substitui a simples marcação em amarelo e preserva a formatação original
    nas partes do texto que não foram alteradas.
    """
    report = []
    todas_regras = {**CACOETES, **GIRIAS}
    dmp = dmp_module.diff_match_patch()

    for p in doc.paragraphs:
        if not p.text.strip():
            continue

        texto_original = p.text
        texto_corrigido = texto_original

        # Etapa 1: Aplica todas as regras de substituição para gerar o texto final
        for pattern, replacement in todas_regras.items():
            texto_corrigido, count = pattern.subn(replacement, texto_corrigido)
            if count > 0:
                # O relatório é simplificado pois o diff mostrará as mudanças
                # Aqui poderíamos adicionar uma lógica mais detalhada se necessário
                pass

        # Etapa 2: Aplica a correção ortográfica no texto já corrigido
        palavras = re.findall(r'\b\w+\b', texto_corrigido)
        palavras_erradas = spell.unknown(palavras)
        texto_final = texto_corrigido
        for palavra in palavras_erradas:
            if palavra.isupper() or palavra[0].isupper():
                continue
            correcao = spell.correction(palavra)
            if correcao and correcao != palavra:
                texto_final = re.sub(r'\b' + re.escape(palavra) + r'\b', correcao, texto_final)

        texto_final = re.sub(r'\s{2,}', ' ', texto_final).strip()
        
        # Etapa 3: Compara o texto original com o final e formata as diferenças
        if texto_final != texto_original:
            # Gera a lista de diferenças
            diffs = dmp.diff_main(texto_original, texto_final)
            dmp.diff_cleanupSemantic(diffs) # Otimiza os diffs para serem mais legíveis

            # Limpa o parágrafo original para reescrevê-lo com a formatação de diff
            p.clear()

            for op, text in diffs:
                run = p.add_run(text)
                # op -1: Deleção. Formata como vermelho e riscado.
                if op == dmp.DIFF_DELETE:
                    run.font.strike = True
                    run.font.color.rgb = RGBColor(255, 0, 0)
                    report.append({'original': text, 'corrigido': '', 'tipo': 'Remoção'})
                # op 1: Inserção. Formata como verde e negrito.
                elif op == dmp.DIFF_INSERT:
                    run.font.bold = True
                    run.font.color.rgb = RGBColor(0, 128, 0)
                    # Adiciona ao relatório
                    # Lógica simples para encontrar o que foi substituído
                    report.append({'original': '', 'corrigido': text, 'tipo': 'Adição'})
                # op 0: Igual. Nenhuma formatação extra.
                elif op == dmp.DIFF_EQUAL:
                    pass

    return doc, report


@app.route('/revisar-documento', methods=['POST'])
def revisar_documento():
    if 'file' not in request.files:
        return jsonify({"error": "Nenhum arquivo enviado"}), 400

    file = request.files['file']
    if not file or file.filename == '':
        return jsonify({"error": "Nome de arquivo vazio ou inválido"}), 400

    if file and file.filename.endswith('.docx'):
        try:
            doc = docx.Document(io.BytesIO(file.read()))
            # Chama a NOVA função que aplica o diff visual
            doc_corrigido, relatorio = aplicar_correcoes_com_diff(doc)

            buffer = io.BytesIO()
            doc_corrigido.save(buffer)
            buffer.seek(0)

            response = send_file(
                buffer,
                as_attachment=True,
                download_name=f"revisado_{file.filename}",
                mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            )

            response.headers['X-Corrections-Report'] = json.dumps(relatorio)
            response.headers['Access-Control-Expose-Headers'] = 'X-Corrections-Report'

            return response

        except Exception as e:
            return jsonify({"error": f"Erro interno ao processar o arquivo: {str(e)}"}), 500

    return jsonify({"error": "Formato de arquivo inválido. Por favor, envie um .docx"}), 400


if __name__ == '__main__':
    app.run(debug=True, port=5000)
