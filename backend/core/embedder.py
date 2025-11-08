from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
import logging, os

def build_vector_store(chunks):
    """Build an in-memory FAISS vector store from document chunks."""
    #embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    embeddings = OpenAIEmbeddings(api_key=os.getenv("OPENAI_API_KEY"))
    texts = [c.page_content for c in chunks[:30]]
    vector_store = FAISS.from_documents(texts, embeddings)
    logging.info("Vector store created successfully.")
    return vector_store
