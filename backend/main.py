# backend/main.py

from fastapi import FastAPI, UploadFile, File, HTTPException
from langchain_huggingface import HuggingFaceEmbeddings, HuggingFacePipeline
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import tempfile
import os
from dotenv import load_dotenv

# LangChain imports
from langchain_core.prompts import ChatPromptTemplate
from langchain_mistralai.chat_models import ChatMistralAI
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain

# Load environment variables
load_dotenv()

# --- Initialize FastAPI App ---
app = FastAPI()

# --- CORS Middleware ---
# This allows your React frontend (running on a different port) to communicate with this backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Adjust this to your React app's URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- In-memory storage for the RAG chain ---
# For a real application, you'd use a more robust solution like Redis, a database, or session management.
# For this demo, a simple global variable will work for a single user.
rag_chain = None

class QueryRequest(BaseModel):
    query: str

# --- LangChain RAG Logic (from previous guide, adapted for API) ---
def create_rag_chain_from_pdf(pdf_file_path: str):
    """Creates the RAG chain from a PDF file path."""
    try:
        # 1. Load the document
        loader = PyPDFLoader(pdf_file_path)
        documents = loader.load()

        # 2. Split the document into chunks
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        document_chunks = text_splitter.split_documents(documents)

        # 3. Create a vector store
        #embeddings = OpenAIEmbeddings()
        embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        vector_store = FAISS.from_documents(document_chunks, embeddings)
        
        # 4. Create the RAG chain
        llm = ChatMistralAI(model="mistral-large-latest")
        prompt_template = """
        You are an expert AI assistant specialized in detecting sensitive data in documents.
        Analyze the provided context and identify any instances of the requested sensitive data type.

        Answer the user's question based on the context below. If you find the requested data, list each instance clearly.
        If you don't find any, state that no such data was found.

        Context:
        {context}

        Question:
        {input}

        Identified Data:
        """
        prompt = ChatPromptTemplate.from_template(prompt_template)
        stuff_chain = create_stuff_documents_chain(llm, prompt)
        retriever = vector_store.as_retriever()
        
        return create_retrieval_chain(retriever, stuff_chain)
    except Exception as e:
        print(f"Error creating RAG chain: {e}")
        return None

# --- API Endpoints ---
@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Endpoint to upload a PDF. It processes the PDF and creates a RAG chain.
    """
    global rag_chain
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
    
    # Use a temporary file to save the uploaded content
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_file_path = tmp_file.name

    try:
        rag_chain = create_rag_chain_from_pdf(tmp_file_path)
        if rag_chain is None:
            raise HTTPException(status_code=500, detail="Failed to process the document.")
        return {"status": "success", "message": "Document processed successfully."}
    finally:
        os.remove(tmp_file_path) # Clean up the temporary file

@app.post("/query")
async def handle_query(request: QueryRequest):
    """
    Endpoint to ask a question to the processed document.
    """
    global rag_chain
    if rag_chain is None:
        raise HTTPException(status_code=400, detail="No document has been processed yet. Please upload a PDF first.")

    try:
        response = rag_chain.invoke({"input": request.query})
        return {"answer": response["answer"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")
