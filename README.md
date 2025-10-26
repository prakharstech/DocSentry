# DocSentry 🕵️

**DocSentry** is a web application designed to detect sensitive data within PDF documents using a Retrieval-Augmented Generation (RAG) approach. This project was developed as part of the Information Security Lab curriculum. It is powered by LangChain, Mistral AI, and local embeddings, providing a user-friendly interface to upload documents and query for specific types of confidential information.



---

## 👥 Team

* Prakhar Srivastava
* Vedant Totla
* Kartikey Goyal

---

## ✨ Features

* **PDF Document Upload**: Securely upload PDF files for analysis.
* **Custom Sensitive Data Queries**: Define the type of sensitive data you want to detect via natural language prompts (e.g., "Find all Social Security Numbers", "Detect API keys").
* **RAG Pipeline**:
    * Uses **LangChain** for orchestration.
    * Embeds document chunks locally using **Hugging Face Sentence Transformers** (`all-MiniLM-L6-v2`).
    * Stores embeddings locally using **FAISS**. (Note: The current code does not implement persistence, embeddings are in-memory).
    * Leverages **Mistral AI's API** (`mistral-large-latest` model) for analyzing retrieved context and identifying sensitive information.
* **Web Interface**: A clean React frontend for interaction.
* **API Backend**: A robust FastAPI backend handling document processing and AI interactions.

---

## 🏗️ Architecture

DocSentry follows a standard client-server architecture:

1.  **Frontend (React)**: Built with Vite, running in the user's browser. It handles file uploads and displays the chat interface. It communicates with the backend via HTTP requests (using Axios).
2.  **Backend (FastAPI)**: A Python server that exposes API endpoints for:
    * `/upload`: Receiving PDFs, chunking text, generating embeddings (locally via Hugging Face), creating an in-memory FAISS index.
    * `/query`: Receiving user prompts, retrieving relevant document chunks from the FAISS index, invoking the Mistral AI LLM via LangChain to get the answer.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

* **Python**: Version 3.8 or higher.
* **Node.js**: Version 18 or higher (for the React frontend). Includes `npm`.
* **Mistral AI API Key**: You need an API key from [Mistral AI](https://console.mistral.ai/).

---

## ⚙️ Setup & Installation

1.  **Clone the Repository**:
    ```bash
    git clone <your-repository-url>
    cd DocSentry-eb2ed076f252b5d642aaff6edf31a6fc878e6066 # Or your project's root directory
    ```

2.  **Backend Setup**:
    * Navigate to the backend directory:
        ```bash
        cd backend
        ```
    * Create and activate a Python virtual environment:
        ```bash
        # On macOS/Linux
        python3 -m venv venv
        source venv/bin/activate

        # On Windows
        python -m venv venv
        .\venv\Scripts\activate
        ```
    * Install the required Python packages:
        ```bash
        pip install -r requirements.txt
        ```
    * Create a `.env` file in the `backend` directory:
        ```
        MISTRAL_API_KEY="your-mistral-api-key-here"
        ```
        **Important**: Do *not* commit the `.env` file to version control. The `.gitignore` file should already be configured to prevent this.

3.  **Frontend Setup**:
    * Navigate to the frontend directory (from the project root):
        ```bash
        cd ../frontend
        ```
    * Install the required Node.js packages:
        ```bash
        npm install
        ```

---

## ▶️ Running the Application

You need to run both the backend and frontend servers simultaneously.

1.  **Start the Backend Server**:
    * Open a terminal, navigate to the `backend` directory.
    * Activate the virtual environment (if not already active).
    * Run the FastAPI server:
        ```bash
        uvicorn main:app --reload
        ```
    * The backend server will typically start on `http://127.0.0.1:8000`.

2.  **Start the Frontend Server**:
    * Open a *separate* terminal, navigate to the `frontend` directory.
    * Run the Vite development server:
        ```bash
        npm run dev
        ```
    * The frontend application will typically be available at `http://localhost:5173`.

---

## 🚀 Usage

1.  Open your web browser and navigate to the frontend URL (e.g., `http://localhost:5173`).
2.  Use the file input to select and upload a PDF document.
3.  Wait for the "Processing..." message to change to "Document ready...". The backend is creating the embeddings during this time.
4.  Enter your query into the chat input (e.g., "Find credit card numbers").
5.  Press "Send" or hit Enter.
6.  The AI's response, based on the document content and powered by Mistral AI, will appear in the chatbox.

---

## 🔑 Environment Variables

The backend requires the following environment variable to be set in the `backend/.env` file:

* `MISTRAL_API_KEY`: Your secret API key for accessing Mistral AI services.

---

## 🔮 Potential Improvements

* **Implement FAISS Persistence**: Modify the backend code to save/load FAISS indexes to disk to avoid reprocessing PDFs (as demonstrated in previous conversation steps).
* **Support More File Types**: Extend functionality to support `.docx`, `.txt`, `.csv`, etc. using different LangChain document loaders.
* **Highlighting Results**: Modify the frontend to highlight the detected sensitive data within the retrieved context.
* **Alternative Models/Embeddings**: Allow swapping Mistral API with local Hugging Face models or different vector stores (like ChromaDB).
* **Enhanced Error Handling**: Provide more specific feedback to the user on the frontend if backend processes fail.
* **Security**: Implement user authentication and authorization if deploying in a multi-user environment.
* **Scalability**: For larger documents or higher traffic, consider a more scalable vector database and potentially asynchronous processing for uploads.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
