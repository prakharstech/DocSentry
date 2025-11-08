from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
import logging

def create_rag_chain(vector_store):
    """Construct the LangChain RAG pipeline with privacy-first design."""
    retriever = vector_store.as_retriever(search_kwargs={"k": 4})
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

    prompt_template = """
    You are DocSentry — an AI compliance and data-security analyst built on a Retrieval-Augmented Generation (RAG) framework.
    Analyze the provided context and detect sensitive information (PII, PHI, financial, or confidential data).

    Follow these strict rules:
    1. Only use the given context — no assumptions.
    2. Quote each sensitive data and explain why it's sensitive.
    3. Avoid false positives like invoice IDs or random numbers.
    4. If none found, reply: "No sensitive information matching the request was found in the provided context."

    Context:
    {context}

    User Query:
    {question}

    Your Analysis:
    """
    prompt = ChatPromptTemplate.from_template(prompt_template)

    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)

    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    logging.info("RAG chain successfully initialized.")
    return rag_chain
