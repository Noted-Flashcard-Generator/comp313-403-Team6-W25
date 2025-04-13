from flask import Flask, request, jsonify
from flask_cors import CORS
from summarizer import TextSummarizer
from questionGenerator import QuestionGenerator
import fitz
import io
import os
from pdfProcessing import extract_text_from_pdf, parse_page_range
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
#Temporarily enable CORS for all routes
CORS(app)

app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024

summarizer = TextSummarizer()
questionGenerator = QuestionGenerator()

#this route is used to check if the generation api is running
@app.route("/status", methods=["GET"])
def status():
    return jsonify({"status": "Server is running."})

#this route is used to summarize the text from selected pages of a pdf file
@app.route("/summarize", methods=["POST"])
def summarize():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        #get pages from request, default to 1-5
        pages = request.form.get("pages", "1-5")
        #format the page numbers for easier use later  
        page_numbers = parse_page_range(pages)
        #open the pdf from the request
        pdf_doc = fitz.open(stream=io.BytesIO(file.read()), filetype="pdf")
        print(len(pdf_doc))
        #extract text from supplied page numbers
        extracted_text = extract_text_from_pdf(pdf_doc, page_numbers)
        summary = summarizer.summarize_text(extracted_text)
        
        return jsonify({"summary": summary}), 200

    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

#summarize raw input text
@app.route("/summarizeraw", methods=["POST"])
def summarize_raw():
    try:
        data = request.json
        if not data or "text" not in data:
            return jsonify({"error": "Missing text field in request"}), 400
        
        text = data.get("text", "").strip()
        if not text:
            return jsonify({"error": "Text can not be empty."}), 400
        #summarize the input text
        summary = summarizer.summarize_text(text)
        return jsonify({"summary": summary})
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

#generate questions and answers from raw text
@app.route("/generate-qa-raw", methods=["POST"])
def generate_qa_raw():
    try:
        data = request.json
        if not data or "text" not in data:
            return jsonify({"error": "missing text field in request"}), 400
        text = data.get("text", "").strip()
        if not text:
            return jsonify({"error": "Text can not be empty."}), 400
        questions = questionGenerator.generate(text)

        return jsonify({"response": questions})
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

#generate questions and answers from pdf
@app.route("/generate-qa", methods=["POST"])
def generate_qa():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        #get pages from request, default to 1-5
        pages = request.form.get("pages", "1-5")
        #format the page numbers for easier use later  
        page_numbers = parse_page_range(pages)
        #open the pdf from the request
        pdf_doc = fitz.open(stream=io.BytesIO(file.read()), filetype="pdf")
        print(len(pdf_doc))
        #extract text from supplied page numbers
        extracted_text = extract_text_from_pdf(pdf_doc, page_numbers)
        #generate questions from extracted text
        questions = questionGenerator.generate(extracted_text)
        
        return jsonify({"response": {"extracted_text": extracted_text, "questions": questions}}), 200

    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3003))  # Use Render's PORT or default to 3003
    app.run(host="0.0.0.0", port=port, debug=True)
