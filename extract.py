import zipfile
import xml.etree.ElementTree as ET

def extract_docx(docx_path, out_path):
    try:
        with zipfile.ZipFile(docx_path) as docx:
            xml_content = docx.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            
            paragraphs = []
            for p in tree.findall('.//w:p', ns):
                texts = [t.text for t in p.findall('.//w:t', ns) if t.text]
                if texts:
                    paragraphs.append(''.join(texts))
            
            with open(out_path, 'w', encoding='utf-8') as f:
                f.write('\n'.join(paragraphs))
            print("Extracted successfully.")
    except Exception as e:
        print(f"Error: {e}")

extract_docx(r'c:\Users\Admin\quan-ly-nha-tro\PAWFECT_FRIENDS.docx', r'c:\Users\Admin\quan-ly-nha-tro\report_text.txt')
