import win32com.client as win32
import os

# Caminho do arquivo original
input_file = r"C:\caminho\para\arquivo.docx"
output_file = r"C:\caminho\para\arquivo_revisado.docx"

# Abre o Word
word = win32.Dispatch("Word.Application")
word.Visible = False  # colocar True para ver o processo

# Abre o documento
doc = word.Documents.Open(input_file)

# Ativa o Track Changes
doc.TrackRevisions = True
doc.ShowRevisions = True

# Exemplo: substituir texto
find = doc.Content.Find
find.Text = "teste"
find.Replacement.Text = "exemplo"
find.Execute(Replace=2)  # 2 = wdReplaceAll

# Salva com as alterações
doc.SaveAs(output_file)

# Fecha
doc.Close()
word.Quit()

print(f"Documento revisado salvo em: {output_file}")
