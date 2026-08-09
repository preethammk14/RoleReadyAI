export interface SampleResume {
  id: string;
  title: string;
  targetRole: string;
  fileName: string;
  text: string;
}

export const SAMPLE_RESUMES: SampleResume[] = [
  {
    id: 'fullstack-dev',
    title: 'Senior Full-Stack Engineer',
    targetRole: 'Full-Stack Developer',
    fileName: 'Alex_Chen_Resume_2026.pdf',
    text: `ALEX CHEN
Full-Stack Software Engineer
Email: alex.chen@example.com | LinkedIn: linkedin.com/in/alexchen-dev | GitHub: github.com/alexchen-dev

SUMMARY:
Results-driven Full-Stack Engineer with 4 years of experience architecting scalable web applications using React, Node.js, Express, TypeScript, and PostgreSQL. Experienced in cloud deployments (AWS, Docker) and CI/CD pipelines.

PROFESSIONAL EXPERIENCE:
Senior Software Engineer | TechPulse Inc. (2024 - Present)
- Architected and deployed microservices using Express, Node.js, and TypeScript serving 100k+ daily active users.
- Redesigned core customer dashboard in React and Tailwind CSS, improving page load speeds by 42%.
- Integrated Stripe payment webhooks and GraphQL APIs, reducing checkout friction and increasing conversion by 15%.

Full-Stack Developer | CloudApex Solutions (2022 - 2024)
- Built real-time analytics dashboard using WebSockets, React, and Redis.
- Authored automated unit and integration test suites using Jest and Cypress, achieving 88% test coverage.
- Optimized PostgreSQL database queries with indexing and caching, dropping API p99 latency from 450ms to 85ms.

SKILLS:
- Languages: JavaScript, TypeScript, Python, HTML5, CSS3, SQL
- Frontend: React.js, Next.js, Redux, Tailwind CSS, Motion
- Backend: Node.js, Express, REST APIs, GraphQL, WebSockets
- Database & Cloud: PostgreSQL, MongoDB, Redis, Docker, AWS S3, Cloud Run, CI/CD
- Tools & Methodologies: Git, Jest, Cypress, Agile/Scrum`
  },
  {
    id: 'ai-ml-engineer',
    title: 'AI / Machine Learning Engineer',
    targetRole: 'AI/ML Engineer',
    fileName: 'Maya_Lin_AIML_Resume.pdf',
    text: `MAYA LIN
AI / ML Engineer & Data Scientist
Email: maya.lin@example.com | GitHub: github.com/mayalin-ai

SUMMARY:
Innovative Machine Learning Engineer specializing in Large Language Models (LLMs), Computer Vision, PyTorch, and GenAI SDKs. 3 years of hands-on experience building end-to-end ML pipelines from data ingestion to API serving.

PROFESSIONAL EXPERIENCE:
AI Engineer | Synthetix AI Labs (2024 - Present)
- Developed and fine-tuned LLMs using LoRA and Hugging Face Transformers for domain-specific medical summaries.
- Implemented RAG (Retrieval-Augmented Generation) pipelines using Qdrant vector database and Gemini API, achieving 94% response accuracy.
- Deployed ML inference server via FastAPI and Docker on GCP Cloud Run.

Data Scientist | DataVanguard Corp (2023 - 2024)
- Built predictive customer churn model using XGBoost and scikit-learn, saving estimated $350k annually.
- Analyzed 5M+ record datasets with Pandas, PySpark, and BigQuery.
- Built interactive Streamlit and Dash dashboards for C-suite executive reporting.

SKILLS:
- ML / AI Frameworks: PyTorch, TensorFlow, Hugging Face, LangChain, LlamaIndex, scikit-learn
- Generative AI: Gemini API, Vector DBs (Milvus, Pinecone, Qdrant), RAG architecture, Prompt Engineering
- Languages & Tools: Python, C++, SQL, Docker, FastAPI, GCP, Git, MLflow`
  },
  {
    id: 'data-analyst',
    title: 'Data Analyst & Insights Specialist',
    targetRole: 'Data Analyst',
    fileName: 'Jordan_Taylor_DataAnalyst.pdf',
    text: `JORDAN TAYLOR
Data & Business Intelligence Analyst
Email: jordan.taylor@example.com | Portfolio: jordantaylor-data.io

SUMMARY:
Detail-oriented Data Analyst with 3 years of experience transforming raw enterprise data into actionable strategic insights using SQL, Python, Tableau, and Excel.

PROFESSIONAL EXPERIENCE:
Data Analyst | CommerceMetrics (2023 - Present)
- Constructed automated ETL pipelines in SQL and Python to unify marketing and sales data across 4 platforms.
- Created interactive Tableau & Power BI executive dashboards tracking $12M+ annual sales metrics.
- Conducted A/B testing statistical analysis for product launch campaigns, yielding 18% higher CTR.

Junior Analyst | FinEdge Analytics (2022 - 2023)
- Processed, cleaned, and audited daily transaction datasets exceeding 500,000 records using SQL and Pandas.
- Identified cost savings opportunities in vendor operations through linear regression modeling.

SKILLS:
- Data Analysis: SQL (PostgreSQL, Snowflake, BigQuery), Python (Pandas, NumPy, Matplotlib, Seaborn), Excel (VLOOKUP, Pivot, Macros)
- Visualization: Tableau, Power BI, Looker Studio, Metabase
- Analytical Methods: Cohort Analysis, A/B Testing, Time Series Forecasting, Regression Analysis`
  }
];
