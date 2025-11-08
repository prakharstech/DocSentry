from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import tempfile, os, logging

from backend.core.loader import load_and_split_pdf
from backend.core.embedder import build_vector_store
from backend.core.rag_chain import create_rag_chain
from backend.core.analyzer import hybrid_analysis

from dotenv import load_dotenv
load_dotenv()

logging.basicConfig(level=logging.INFO)
app = FastAPI(title="DocSentry API", version="3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174","https://doc-sentry.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rag_chain = None
vector_store = None
latest_text = ""

class QueryRequest(BaseModel):
    query: str

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    global rag_chain, vector_store, latest_text
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed.")

    tmp_path = tempfile.mktemp(suffix=".pdf")
    with open(tmp_path, "wb") as f:
        f.write(await file.read())

    try:
        chunks = load_and_split_pdf(tmp_path)
        vector_store = build_vector_store(chunks)
        rag_chain = create_rag_chain(vector_store)
        latest_text = "\n".join([c.page_content for c in chunks])
        logging.info(f"Document {file.filename} processed successfully.")
        return {"status": "success", "message": "PDF processed successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        os.remove(tmp_path)

@app.post("/query")
async def query_doc(request: QueryRequest):
    global rag_chain, latest_text
    if not rag_chain:
        raise HTTPException(status_code=400, detail="No document uploaded yet.")
    try:
        llm_output = rag_chain.invoke(request.query)
        result = hybrid_analysis(latest_text, llm_output)

        # Format human-readable response for frontend
        formatted_response = ""

        # Pattern-based matches
        if result["pattern_based"]:
            formatted_response += "🧩 **Pattern-Based Detections:**\n"
            for m in result["pattern_based"]:
                formatted_response += f"- {m['type'].capitalize()}: `{m['value']}`\n"
            formatted_response += "\n"

        # Contextual (LLM) analysis
        formatted_response += "🤖 **Contextual Analysis:**\n"
        formatted_response += result["contextual_analysis"] or "No contextual findings."

        return {"answer": formatted_response}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
async def root():
    return {"message": "DocSentry v3.0 running"}
