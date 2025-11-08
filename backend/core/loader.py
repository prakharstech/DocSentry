from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
import logging

def load_and_split_pdf(pdf_path):
    """Load and split a PDF into semantic chunks."""
    loader = PyPDFLoader(pdf_path)
    documents = loader.load()
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = splitter.split_documents(documents)
    logging.info(f"Loaded {len(documents)} pages and split into {len(chunks)} chunks")
    return chunks
