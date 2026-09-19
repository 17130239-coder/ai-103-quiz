#!/usr/bin/env python3
import json
import os

JSON_PATH = "data/ai-103-questions.json"
JS_PATH = "data/questions-data.js"

with open(JSON_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

questions = data["questions"]

# --- 1. Yes/No Questions (7 questions) ---
YES_NO_DATA = {
    10: [
        {"id": "s1", "text": "The LangChain service will appear in Traces without configuring a tracer.", "answer": "No"},
        {"id": "s2", "text": "Setting different OTEL_SERVICE_NAME values separates the services in Application Insights.", "answer": "Yes"},
        {"id": "s3", "text": "When using enable_content_recording=False, prompts and tool data will be captured in the telemetry.", "answer": "No"}
    ],
    107: [
        {"id": "s1", "text": "Changing the content filtering configuration to low severity will resolve the fine-tuning job issues.", "answer": "No"},
        {"id": "s2", "text": "The difference between the 12% and 4% content harm defect rate is consistent with the different severity thresholds used in Run1 and Run2.", "answer": "Yes"},
        {"id": "s3", "text": "The identical 6% protected material evaluation values across Run1 and Run2 indicate that this metric is unaffected by the change in the severity threshold.", "answer": "Yes"}
    ],
    117: [
        {"id": "s1", "text": "The code will display the name of each detected brand with a confidence equal to or higher than 75 percent.", "answer": "Yes"},
        {"id": "s2", "text": "The code will display coordinates for the top-left corner of the rectangle that contains the brand logo of the displayed brands.", "answer": "Yes"},
        {"id": "s3", "text": "The code will display coordinates for the bottom-right corner of the rectangle that contains the brand logo of the displayed brands.", "answer": "No"}
    ],
    127: [
        {"id": "s1", "text": "For sample_text, audit will include entity records for Contact and SSN.", "answer": "No"},
        {"id": "s2", "text": "For sample_text, text_for_model will include john.doe@contoso.com and 859-98-0987.", "answer": "No"},
        {"id": "s3", "text": "For sample_text, text_for_model will contain entity type masks for John Doe and 312-555-1234.", "answer": "Yes"}
    ],
    151: [
        {"id": "s1", "text": "The code will detect the language of documents.", "answer": "No"},
        {"id": "s2", "text": "The url attribute returned for each linked entity will be a Bing search link.", "answer": "No"},
        {"id": "s3", "text": "The matches attribute returned for each linked entity will provide the location in a document where the entity is referenced.", "answer": "Yes"}
    ],
    154: [
        {"id": "s1", "text": "The response will contain an explanation of large language models (LLMs) that has a high degree of certainty.", "answer": "No"},
        {"id": "s2", "text": "Changing 'What is an LLM?' to 'What is an LLM in the context of AI models?' will produce the intended response.", "answer": "No"},
        {"id": "s3", "text": "Changing 'You are a helpful assistant.' to 'You must answer only within the context of AI language models.' will give a higher likelihood of producing the intended response.", "answer": "Yes"}
    ],
    160: [
        {"id": "s1", "text": "Going to http://localhost:5000/status will query the Azure endpoint to verify whether the API key used to start the container is valid.", "answer": "No"},
        {"id": "s2", "text": "The container logging provider will write log data.", "answer": "No"},
        {"id": "s3", "text": "Going to http://localhost:5000/swagger will provide the details to access the documentation for the available endpoints.", "answer": "Yes"}
    ]
}

# --- 2. Drag & Drop Questions (9 questions) ---
DRAG_DROP_DATA = {
    6: {
        "targets": [
            {"id": "t1", "label": "Access up-to-date information from public websites", "answer": "Grounding with Bing Search"},
            {"id": "t2", "label": "Perform calculations during conversations", "answer": "Code interpreter"},
            {"id": "t3", "label": "Retrieve information from documents uploaded directly to the agent", "answer": "File search"}
        ],
        "pool": ["Code interpreter", "Computer use", "File search", "Grounding with Bing Search", "Microsoft Fabric"]
    },
    16: {
        "targets": [
            {"id": "t1", "label": "First blank (in run payload)", "answer": "tool_choice"},
            {"id": "t2", "label": "Second blank (value for tool_choice)", "answer": "required"}
        ],
        "pool": ["auto", "required", "response_format", "tool_choice", "tools", "type"]
    },
    26: {
        "targets": [
            {"id": "t1", "label": "Unsupported responses", "answer": "Groundedness evaluation metrics"},
            {"id": "t2", "label": "Policy violations", "answer": "Risk and safety metrics"}
        ],
        "pool": ["Groundedness evaluation metrics", "Latency breakdown traces", "Risk and safety metrics", "Token usage analytics"]
    },
    36: {
        "targets": [
            {"id": "t1", "label": "Pipeline1 (initial triage)", "answer": "Single-file task in standard mode"},
            {"id": "t2", "label": "Pipeline2 (comprehensive evaluation)", "answer": "Multi-file task in pro mode"}
        ],
        "pool": ["Multi-file task in pro mode", "Multi-file task in standard mode", "Single-file task in pro mode", "Single-file task in standard mode"]
    },
    46: {
        "targets": [
            {"id": "t1", "label": "Pipeline1 (cost-effective initial check)", "answer": "Single-file task in standard mode"},
            {"id": "t2", "label": "Pipeline2 (deep multimodal evaluation)", "answer": "Multi-file task in pro mode"}
        ],
        "pool": ["Multi-file task in pro mode", "Multi-file task in standard mode", "Single-file task in pro mode", "Single-file task in standard mode"]
    },
    56: {
        "targets": [
            {"id": "t1", "label": "Increased response time", "answer": "Latency breakdown traces"},
            {"id": "t2", "label": "Increased inference costs", "answer": "Token usage analytics"}
        ],
        "pool": ["Groundedness evaluation metrics", "Latency breakdown traces", "Risk and safety metrics", "Token usage analytics"]
    },
    66: {
        "targets": [
            {"id": "t1", "label": "Answers do not address the user's question", "answer": "Relevance Evaluation"},
            {"id": "t2", "label": "Responses are longer than expected", "answer": "Completion token analytics"}
        ],
        "pool": ["Completion token analytics", "Groundedness evaluation", "Latency timeline", "Prompt traces", "Relevance Evaluation"]
    },
    76: {
        "targets": [
            {"id": "t1", "label": "Analyze uploaded spreadsheets and generate charts", "answer": "Code Interpreter"},
            {"id": "t2", "label": "Interact with the legacy claims management website", "answer": "Computer Use"},
            {"id": "t3", "label": "Retrieve information from uploaded policy documents", "answer": "File Search"}
        ],
        "pool": ["Code Interpreter", "Computer Use", "File Search", "Grounding with Bing Search", "Microsoft Fabric"]
    },
    86: {
        "targets": [
            {"id": "t1", "label": "Research recent court decisions", "answer": "Grounding with Bing Search"},
            {"id": "t2", "label": "Search uploaded contracts", "answer": "File Search"},
            {"id": "t3", "label": "Download evidence from the compliance portal", "answer": "Computer Use"}
        ],
        "pool": ["Code Interpreter", "Computer Use", "File Search", "Grounding with Bing Search", "Microsoft Fabric"]
    }
}

# --- 3. Matching / Hot Area Questions (41 questions) ---
HOT_AREA_DATA = {
    3: [
        {"id": "b1", "label": "Prompt shields action", "answer": "Set action to block", "options": ["Set action to block", "Set action to alert", "Set action to annotate", "Set action to none"]},
        {"id": "b2", "label": "Additional mitigation", "answer": "Enable Spotlighting", "options": ["Enable Spotlighting", "Disable Spotlighting", "Use regex filter", "Enable content credentials"]}
    ],
    9: [
        {"id": "b1", "label": "Evaluation comparison", "answer": "Compare against the latest approved baseline", "options": ["Compare against the latest approved baseline", "Compare against the previous workflow run", "Compare against the production deployment logs", "Compare against the repository default branch"]},
        {"id": "b2", "label": "If evaluation regression exceeds tolerance", "answer": "Fail the workflow", "options": ["Fail the workflow", "Continue deployment and send an alert", "Retry the evaluation automatically", "Lock the target branch"]}
    ],
    13: [
        {"id": "b1", "label": "Set tool_choice to", "answer": "required", "options": ["required", "auto", "none", "specific"]},
        {"id": "b2", "label": "Configure the tool to authenticate by", "answer": "Using a distinct agent identity bound to the client application", "options": ["Using a distinct agent identity bound to the client application", "Storing API keys in prompts", "Using the shared project agent identity", "Using anonymous access"]}
    ],
    19: [
        {"id": "b1", "label": "Evaluation to execute", "answer": "Groundedness evaluation", "options": ["Groundedness evaluation", "Coherence evaluation", "Fluency evaluation", "Code interpreter evaluation"]},
        {"id": "b2", "label": "Pull request policy", "answer": "Require the evaluation workflow to succeed before merging", "options": ["Require the evaluation workflow to succeed before merging", "Allow merge if evaluation completes with warnings", "Trigger deployment on pull request creation", "Ignore evaluation results for main branch"]}
    ],
    23: [
        {"id": "b1", "label": "Metrics to enable", "answer": "Model Availability Rate and Provisioned Utilization", "options": ["Model Availability Rate and Provisioned Utilization", "Token Count and Error Rate", "Latency and Storage Bandwidth", "Request Count only"]},
        {"id": "b2", "label": "Diagnostic log to collect", "answer": "RequestResponse", "options": ["RequestResponse", "AuditLogs", "MetricsOnly", "SecurityEvents"]}
    ],
    29: [
        {"id": "b1", "label": "To retain user preferences across conversations", "answer": "Agent memory that uses persistent storage", "options": ["Agent memory that uses persistent storage", "Prompt caching", "In-memory session state", "Client-side browser cookies"]},
        {"id": "b2", "label": "To enable users to provide contextual grounding during chats", "answer": "File search tool", "options": ["File search tool", "Bing search tool", "Code interpreter tool", "Fabric connector"]}
    ],
    33: [
        {"id": "b1", "label": "Workflow step type", "answer": "ask_question", "options": ["ask_question", "basic chat", "data transformation", "execute refund"]},
        {"id": "b2", "label": "Condition for execution", "answer": "approval == \"approved\"", "options": ["approval == \"approved\"", "approval != \"rejected\"", "status == \"completed\"", "always execute"]}
    ],
    43: [
        {"id": "b1", "label": "If/else condition expression", "answer": "Not(IsBlank(Local.Var01))", "options": ["Not(IsBlank(Local.Var01))", "IsBlank(Local.Var01)", "IsEmpty(Local.Var01)", "HasValue(Local.Var01)"]},
        {"id": "b2", "label": "Send message expression", "answer": "{Upper(Local.Var01)}", "options": ["{Upper(Local.Var01)}", "{Local.Var01}", "{Upper(Var01)}", "{Trim(Var01)}"]}
    ],
    49: [
        {"id": "b1", "label": "Authentication method", "answer": "An Azure Login action that uses OpenID Connect (OIDC)", "options": ["An Azure Login action that uses OpenID Connect (OIDC)", "A personal access token (PAT)", "A user-assigned managed identity", "A service principal with client secret"]},
        {"id": "b2", "label": "If the evaluation results are NOT met", "answer": "Fail", "options": ["Fail", "Send an alert", "Lock the target branch", "Skip evaluation"]}
    ],
    53: [
        {"id": "b1", "label": "Credential class", "answer": "DefaultAzureCredential", "options": ["DefaultAzureCredential", "AzureKeyCredential", "ClientSecretCredential", "UsernamePasswordCredential"]},
        {"id": "b2", "label": "Responses API method", "answer": "create", "options": ["create", "compact", "send", "generate"]}
    ],
    59: [
        {"id": "b1", "label": "Authentication type", "answer": "System-assigned managed identity", "options": ["System-assigned managed identity", "User-assigned managed identity", "storage account access keys", "Shared Access Signature (SAS)"]},
        {"id": "b2", "label": "Azure RBAC role", "answer": "Storage Blob Data Reader", "options": ["Storage Blob Data Reader", "Storage Blob Data Contributor", "Storage Queue Data Contributor", "Owner"]}
    ],
    63: [
        {"id": "b1", "label": "Guardrails configuration", "answer": "Select User input, Output, Tool response, and Tool call and set Action to Block.", "options": ["Select User input, Output, Tool response, and Tool call and set Action to Block.", "Select Tool call and set Action to Block.", "Select User input and Output and set Action to Annotate.", "Select User input and Tool response and set Action to Annotate."]},
        {"id": "b2", "label": "Storage access method", "answer": "A system-assigned managed identity that is assigned the Storage Blob Data Reader role", "options": ["A system-assigned managed identity that is assigned the Storage Blob Data Reader role", "A system-assigned managed identity that is assigned the Storage Blob Data Contributor role", "A user-assigned identity that is assigned the Storage Queue Data Contributor role", "Storage account access keys"]}
    ],
    69: [
        {"id": "b1", "label": "Evaluation metric", "answer": "Groundedness", "options": ["Groundedness", "Coherence", "Fluency", "Similarity"]},
        {"id": "b2", "label": "Recommended configuration", "answer": "Reject responses that do not meet the groundedness threshold.", "options": ["Reject responses that do not meet the groundedness threshold.", "Increase the model temperature.", "Increase the maximum completion tokens.", "Fine-tune the model by using the retrieved documents."]}
    ],
    73: [
        {"id": "b1", "label": "To retain attorney preferences across conversations", "answer": "Agent memory that uses persistent storage", "options": ["Agent memory that uses persistent storage", "Conversation history", "Orchestration-managed session context", "Prompt cache"]},
        {"id": "b2", "label": "To retrieve uploaded documents", "answer": "File search tool", "options": ["File search tool", "Code interpreter tool", "Computer use tool", "Azure AI Translator"]}
    ],
    79: [
        {"id": "b1", "label": "To analyze uploaded spreadsheets", "answer": "Code Interpreter Tool", "options": ["Code Interpreter Tool", "File Search Tool", "Computer Use Tool", "Azure AI Search Tool"]},
        {"id": "b2", "label": "To retrieve current weather information", "answer": "Grounding with Bing Search", "options": ["Grounding with Bing Search", "File Search Tool", "Computer Use Tool", "Microsoft Fabric tool"]}
    ],
    83: [
        {"id": "b1", "label": "To answer questions from uploaded contracts", "answer": "File Search Tool", "options": ["File Search Tool", "Code Interpreter Tool", "Grounding with Bing Search", "Computer Use Tool"]},
        {"id": "b2", "label": "To generate charts from Excel workbooks", "answer": "Code Interpreter Tool", "options": ["Code Interpreter Tool", "File Search Tool", "Azure AI Search Tool", "Microsoft Fabric Tool"]}
    ],
    89: [
        {"id": "b1", "label": "Authentication method", "answer": "Azure Login action that uses OpenID Connect (OIDC)", "options": ["Azure Login action that uses OpenID Connect (OIDC)", "Personal access token (PAT)", "Storage account access key", "Publish Profile"]},
        {"id": "b2", "label": "Credential management", "answer": "Configure workload identity federation", "options": ["Configure workload identity federation", "Store credentials as GitHub repository secrets", "Rotate PAT every 30 days", "Use a shared administrator account"]}
    ],
    93: [
        {"id": "b1", "label": "Temperature setting", "answer": "0", "options": ["0", "0.5", "0.7", "1.0"]},
        {"id": "b2", "label": "Output effort setting", "answer": "high", "options": ["high", "medium", "low", "default"]}
    ],
    103: [
        {"id": "b1", "label": "Quality metrics to evaluate", "answer": "Groundedness and Relevance", "options": ["Groundedness and Relevance", "Coherence and Fluency", "Similarity and BLEU", "Recall and F1 score"]}
    ],
    105: [
        {"id": "b1", "label": "Field value type", "answer": "string", "options": ["string", "int", "boolean", "array"]},
        {"id": "b2", "label": "Field method", "answer": "generate", "options": ["generate", "classify", "summarize", "transform"]}
    ],
    109: [
        {"id": "b1", "label": "Orchestration pattern", "answer": "The sequential template that passes outputs node by-node", "options": ["The sequential template that passes outputs node by-node", "The concurrent template executing all nodes simultaneously", "The fan-out/fan-in parallel template", "The agentic autonomous loop template"]},
        {"id": "b2", "label": "Approval checkpoints", "answer": "Add an Ask a question node", "options": ["Add an Ask a question node", "Add an Event Grid trigger", "Add a Webhook callback", "Add a Manual Polling task"]}
    ],
    113: [
        {"id": "b1", "label": "Managed identity scope", "answer": "Enable a system-assigned managed identity at the project level", "options": ["Enable a system-assigned managed identity at the project level", "Enable a user-assigned managed identity on the subscription", "Use a service principal credential", "Use Key Vault access policies"]},
        {"id": "b2", "label": "Key Vault authorization method", "answer": "Assign the Key Vault Secrets User role to the managed identity", "options": ["Assign the Key Vault Secrets User role to the managed identity", "Assign the Key Vault Administrator role", "Assign the Contributor role on the resource group", "Generate a shared SAS token"]}
    ],
    115: [
        {"id": "b1", "label": "Capture nested operations across the entire agent run", "answer": "Hierarchical spans", "options": ["Hierarchical spans", "Flat metric points", "Custom application logs", "Error traces only"]},
        {"id": "b2", "label": "Record tool invocation arguments and results", "answer": "Tool call attributes", "options": ["Tool call attributes", "Session tags", "HTTP header baggage", "Console stdout"]}
    ],
    119: [
        {"id": "b1", "label": "Connection category", "answer": "AzureKeyVault", "options": ["AzureKeyVault", "CognitiveServices", "CustomService", "AzureBlobStorage"]},
        {"id": "b2", "label": "Authentication type (authType)", "answer": "AccountManagedIdentity", "options": ["AccountManagedIdentity", "ApiKey", "AADToken", "Anonymous"]}
    ],
    123: [
        {"id": "b1", "label": "Knowledge grounding requirement", "answer": "Configure retrieval from approved data sources", "options": ["Configure retrieval from approved data sources", "Enable web search grounding", "Fine-tune model on public data", "Cache previous user inputs"]},
        {"id": "b2", "label": "Memory requirement", "answer": "Enable agent memory that uses persistent storage", "options": ["Enable agent memory that uses persistent storage", "Use client-side local storage", "Store conversation in system prompt", "Disable memory"]}
    ],
    125: [
        {"id": "b1", "label": "Resolution for HTTP 429", "answer": "Implement exponential backoff and jitter in the retry logic", "options": ["Implement exponential backoff and jitter in the retry logic", "Increase request payload size", "Switch immediately to another region", "Disable rate limiting header"]},
        {"id": "b2", "label": "Resolution for HTTP 400", "answer": "Split content into smaller files before uploading the files", "options": ["Split content into smaller files before uploading the files", "Retry without changing request body", "Upgrade service tier", "Change API version to v1.0"]}
    ],
    129: [
        {"id": "b1", "label": "Resource kind", "answer": "OpenAI", "options": ["OpenAI", "CognitiveServices", "TextAnalytics", "SearchServices"]},
        {"id": "b2", "label": "CLI command parameter", "answer": "--encryption", "options": ["--encryption", "--security-key", "--keyvault-link", "--cmk"]}
    ],
    133: [
        {"id": "b1", "label": "Request initialization", "answer": "request = AnalyzeTextOptions(text=comment)", "options": ["request = AnalyzeTextOptions(text=comment)", "request = AnalyzeOptions(comment)", "request = TextContent(comment)", "request = SafetyAnalysis(comment)"]},
        {"id": "b2", "label": "Analysis call", "answer": "response = client.analyze_text(request)", "options": ["response = client.analyze_text(request)", "response = client.execute(request)", "response = client.check(request)", "response = client.post(request)"]}
    ],
    135: [
        {"id": "b1", "label": "First action", "answer": "Create a project.", "options": ["Create a project.", "Upload and tag images.", "Train the classifier model.", "Initialize the training dataset.", "Train the object detection model."]},
        {"id": "b2", "label": "Second action", "answer": "Upload and tag images.", "options": ["Upload and tag images.", "Create a project.", "Train the classifier model.", "Initialize the training dataset.", "Train the object detection model."]},
        {"id": "b3", "label": "Third action", "answer": "Train the classifier model.", "options": ["Train the classifier model.", "Create a project.", "Upload and tag images.", "Initialize the training dataset.", "Train the object detection model."]}
    ],
    139: [
        {"id": "b1", "label": "HTTP method", "answer": "PUT", "options": ["PUT", "POST", "PATCH", "GET"]},
        {"id": "b2", "label": "Resource kind", "answer": "CognitiveServices", "options": ["CognitiveServices", "ComputerVision", "TextAnalytics", "OpenAI"]}
    ],
    141: [
        {"id": "b1", "label": "JSON data projection", "answer": "Object projection", "options": ["Object projection", "File projection", "Table projection", "String projection"]},
        {"id": "b2", "label": "Extracted text data projection", "answer": "Table projection", "options": ["Table projection", "Object projection", "File projection", "String projection"]}
    ],
    143: [
        {"id": "b1", "label": "The percentage of false positives is", "answer": "0", "options": ["0", "25", "30", "50", "100"]},
        {"id": "b2", "label": "The value for TP / (TP + FN) is", "answer": "100", "options": ["100", "0", "25", "30", "50"]}
    ],
    145: [
        {"id": "b1", "label": "First action", "answer": "Add a new query key", "options": ["Add a new query key", "Change the app to use the new key", "Delete the compromised key", "Regenerate the primary admin key", "Regenerate the secondary admin key", "Change the app to use the secondary admin key"]},
        {"id": "b2", "label": "Second action", "answer": "Change the app to use the new key", "options": ["Change the app to use the new key", "Add a new query key", "Delete the compromised key", "Regenerate the primary admin key", "Regenerate the secondary admin key", "Change the app to use the secondary admin key"]},
        {"id": "b3", "label": "Third action", "answer": "Delete the compromised key", "options": ["Delete the compromised key", "Add a new query key", "Change the app to use the new key", "Regenerate the primary admin key", "Regenerate the secondary admin key", "Change the app to use the secondary admin key"]}
    ],
    148: [
        {"id": "b1", "label": "Project Type", "answer": "Classification", "options": ["Classification", "Object Detection"]},
        {"id": "b2", "label": "Classification Type", "answer": "Multiclass (Single tag per image)", "options": ["Multiclass (Single tag per image)", "Multilabel (Multiple tags per image)"]},
        {"id": "b3", "label": "Domain", "answer": "General (compact)", "options": ["General (compact)", "Adult", "Food", "General", "Landmarks", "Landmarks (compact)", "Retail"]}
    ],
    152: [
        {"id": "b1", "label": "Model evaluation", "answer": "Use model catalog leaderboards and model cards.", "options": ["Use model catalog leaderboards and model cards.", "Configure private endpoint access.", "Use deployment lists and license tabs.", "Use tool catalog connections and run traces."]},
        {"id": "b2", "label": "Deployment option", "answer": "Use a serverless deployment.", "options": ["Use a serverless deployment.", "Bring your own model.", "Build a vector index.", "Use a managed compute deployment."]}
    ],
    158: [
        {"id": "b1", "label": "Extract text", "answer": "Azure Document Intelligence in Foundry Tools", "options": ["Azure Document Intelligence in Foundry Tools", "Azure AI Search", "Azure Vision in Foundry Tools"]},
        {"id": "b2", "label": "Perform sentiment analysis", "answer": "Azure Language in Foundry Tools", "options": ["Azure Language in Foundry Tools", "Azure AI Search", "Azure AI Computer Vision", "Azure Document Intelligence in Foundry Tools"]}
    ],
    163: [
        {"id": "b1", "label": "First action", "answer": "Provision an on-premises Kubernetes cluster that has internet connectivity.", "options": ["Provision an on-premises Kubernetes cluster that has internet connectivity.", "Pull an image from the Microsoft Container Registry (MCR).", "Run the container and specify an API key and the Endpoint URL of the Azure AI resource.", "Pull an image from Docker Hub.", "Provision an on-premises Kubernetes cluster that is isolated from the internet.", "Provision an Azure Kubernetes Service (AKS) resource.", "Run the container and specify an App ID and Client Secret."]},
        {"id": "b2", "label": "Second action", "answer": "Pull an image from the Microsoft Container Registry (MCR).", "options": ["Pull an image from the Microsoft Container Registry (MCR).", "Provision an on-premises Kubernetes cluster that has internet connectivity.", "Run the container and specify an API key and the Endpoint URL of the Azure AI resource.", "Pull an image from Docker Hub.", "Provision an on-premises Kubernetes cluster that is isolated from the internet.", "Provision an Azure Kubernetes Service (AKS) resource.", "Run the container and specify an App ID and Client Secret."]},
        {"id": "b3", "label": "Third action", "answer": "Run the container and specify an API key and the Endpoint URL of the Azure AI resource.", "options": ["Run the container and specify an API key and the Endpoint URL of the Azure AI resource.", "Provision an on-premises Kubernetes cluster that has internet connectivity.", "Pull an image from the Microsoft Container Registry (MCR).", "Pull an image from Docker Hub.", "Provision an on-premises Kubernetes cluster that is isolated from the internet.", "Provision an Azure Kubernetes Service (AKS) resource.", "Run the container and specify an App ID and Client Secret."]}
    ],
    164: [
        {"id": "b1", "label": "HTTP method", "answer": "POST", "options": ["POST", "GET", "PATCH", "PUT"]},
        {"id": "b2", "label": "visualFeatures parameter", "answer": "imageType", "options": ["imageType", "description", "objects", "tags"]}
    ],
    166: [
        {"id": "b1", "label": "Deployment type", "answer": "Standard", "options": ["Standard", "Global Standard", "Global Provisioned"]},
        {"id": "b2", "label": "Version update policy", "answer": "Opt out of automatic model version upgrades", "options": ["Opt out of automatic model version upgrades", "Once the current version expires", "Upgrade once a new default version becomes available"]}
    ],
    173: [
        {"id": "b1", "label": "Method to generate video", "answer": "create", "options": ["create", "download_content", "list", "retrieve"]}
    ],
    175: [
        {"id": "b1", "label": "Authentication credential", "answer": "DefaultAzureCredential()", "options": ["DefaultAzureCredential()", "AzureKeyCredential()", "None"]},
        {"id": "b2", "label": "Retrieve agent object", "answer": "project_client.agents.get(agent_name=myAgent)", "options": ["project_client.agents.get(agent_name=myAgent)", "project_client.agents.create(name=myAgent)", "project_client.get_agent()", "myAgent"]}
    ]
}

# Attach interactive structures to questions
enriched_count = 0

for q in questions:
    qid = q["id"]
    if qid in YES_NO_DATA:
        q["interactive"] = {
            "type": "yes_no",
            "statements": YES_NO_DATA[qid]
        }
        enriched_count += 1
    elif qid in DRAG_DROP_DATA:
        q["interactive"] = {
            "type": "matching",
            "targets": DRAG_DROP_DATA[qid]["targets"],
            "pool": DRAG_DROP_DATA[qid]["pool"]
        }
        enriched_count += 1
    elif qid in HOT_AREA_DATA:
        q["interactive"] = {
            "type": "dropdown",
            "blanks": HOT_AREA_DATA[qid]
        }
        enriched_count += 1

print(f"Successfully enriched {enriched_count} questions out of {len(questions)}!")

# Save to data/ai-103-questions.json
with open(JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# Save to data/questions-data.js for instant offline browser loading
js_content = "window.QUIZ_QUESTIONS_DATA = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n"
with open(JS_PATH, "w", encoding="utf-8") as f:
    f.write(js_content)

print("Saved updated questions to both JSON and JS files successfully.")
