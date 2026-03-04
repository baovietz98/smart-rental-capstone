import sys
try:
    import PyPDF2
    with open('c:/Users/Admin/quan-ly-nha-tro/baocaocapstone.pdf', 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ''
        for page in reader.pages:
            try:
                text += page.extract_text() + '\n'
            except Exception as e:
                print(f"Error on page: {e}")
    with open('c:/Users/Admin/quan-ly-nha-tro/pdf_report.txt', 'w', encoding='utf-8') as out:
        out.write(text)
    print("Success")
except Exception as e:
    print(f"Error: {e}")
