/**
 * File: schemas.js
 * Description: Contains the embedded JSON schemas for ticket and conversation data structures,
 * and field definitions to avoid CORS issues when running locally.
 * Author: D.A.R.Y.L. & Taylor Giddens
 */

// This function provides a clean copy of the default schemas.
function getDefaultSchemas() {
    return {
        light: {
            ticket: {
                id: true,
                subject: true,
                description_text: true,
                status: true,
                priority: true,
                type: true,
                requester_id: true,
                created_at: true,
                custom_fields: {
                    module: true,
                    what_is_affected: true,
                    root_cause: true,
                }
            },
            conversations: {
                body_text: true,
                user_id: true,
                created_at: true,
                incoming: true,
                private: true,
                source: true,
            }
        },
        extended: {
            ticket: {
                id: true,
                cc_emails: true,
                fwd_emails: true,
                reply_cc_emails: true,
                fr_escalated: true,
                spam: true,
                group_id: true,
                priority: true,
                requester_id: true,
                responder_id: true,
                source: true,
                status: true,
                subject: true,
                type: true,
                due_by: true,
                fr_due_by: true,
                is_escalated: true,
                description_text: true,
                created_at: true,
                updated_at: true,
                tags: true,
                custom_fields: {
                    categories: true,
                    cf_123: true,
                    cf_456: true,
                    environment: true,
                    impact: true,
                    incident_type: true,
                    module: true,
                    platform_version: true,
                    root_cause: true,
                    ticket_type: true,
                    what_is_affected: true,
                }
            },
            conversations: {
                id: true,
                body_text: true,
                user_id: true,
                created_at: true,
                updated_at: true,
                incoming: true,
                private: true,
                source: true,
            }
        }
    };
}


// This function initializes the global schema variables with the defaults.
function setDefaultSchemas() {
    const defaults = getDefaultSchemas();
    // Use deep copies to prevent mutations from affecting the defaults
    lightExtractSchema = JSON.parse(JSON.stringify(defaults.light));
    extendedExtractSchema = JSON.parse(JSON.stringify(defaults.extended));
}



const sampleTicketData = {
    "ticket": {
        "cc_emails": [],
        "fwd_emails": [],
        "reply_cc_emails": [],
        "fr_escalated": false,
        "spam": false,
        "email_config_id": null,
        "group_id": 23000296332,
        "priority": 1,
        "requester_id": 23003607772,
        "responder_id": 23001614074,
        "source": 2,
        "status": 2,
        "subject": "Sample Ticket: Conflicting Renewal Information",
        "support_email": "support@yourcompany.com",
        "to_emails": [],
        "product_id": null,
        "id": 248727,
        "type": "Incident",
        "due_by": "2025-09-19T14:26:59Z",
        "fr_due_by": "2025-09-05T22:26:30Z",
        "is_escalated": false,
        "description": "<div>Hello, we're seeing conflicting renewal information...</div>",
        "description_text": "Hello, we're seeing conflicting renewal information...",
        "created_at": "2025-09-05T14:26:26Z",
        "updated_at": "2025-09-07T15:41:53Z",
        "tags": [
            "renewal",
            "billing",
            "vip"
        ],
        "attachments": [],
        "custom_fields": {
            "categories": "Renewal & Expiration issues",
            "cf_123": "Adobe VIP Marketplace",
            "cf_456": "Commercial",
            "environment": "Production",
            "escalated": null,
            "escalation_datetime": null,
            "field_1": null,
            "field_2": null,
            "impact": "Only one customer is affected",
            "incident_type": "Technical issue",
            "major_incident_type": null,
            "module": "Connect-related",
            "platform_version": "SaaS",
            "problem_management_input": null,
            "problem_management_outcome": null,
            "problem_management_subinput": null,
            "problem_management_suboutcome": null,
            "root_cause": null,
            "score": "29989.0",
            "service_request_items": null,
            "service_request_subtypes": null,
            "service_request_types": null,
            "subcategories": null,
            "tam_request_category": null,
            "ticket_type": "Incident or Problem",
            "what_is_affected": "Subscriptions",
            "business_impact": null,
            "impacted_locations": null,
            "no_of_customers_impacted": null,
            "contact_number": null,
            "pending_other_ticket_id": null,
            "escalated_by": null,
            "cb_correlation_id": null
        }
    }
};

const sampleConversationData = {
    "conversations": [{
        "id": 23055675408,
        "user_id": 23001614074,
        "to_emails": [],
        "body": "<div>Thank you for contacting CloudBlue Technical Support.</div>",
        "body_text": "Thank you for contacting CloudBlue Technical Support.",
        "ticket_id": 248727,
        "created_at": "2025-09-07T15:41:53Z",
        "updated_at": "2025-09-07T15:41:53Z",
        "incoming": false,
        "private": false,
        "source": 0,
        "attachments": []
    }]
};

const definitionsData = {
    "fields": {
        "ticket.id": { "label": "Ticket ID", "description": "The unique identifier for the ticket." },
        "ticket.cc_emails": { "label": "CC Emails", "description": "Email addresses of people CC'd on the ticket." },
        "ticket.fwd_emails": { "label": "Forwarded Emails", "description": "Email addresses to which the ticket has been forwarded." },
        "ticket.reply_cc_emails": { "label": "Reply CC Emails", "description": "Email addresses CC'd on replies." },
        "ticket.fr_escalated": { "label": "First Response Escalated", "description": "Indicates if the ticket was escalated before the first response.", "type": "boolean", "example": "false" },
        "ticket.spam": { "label": "Is Spam", "description": "Indicates if the ticket is marked as spam.", "type": "boolean", "example": "false" },
        "ticket.group_id": { "label": "Group ID", "description": "The ID of the agent group the ticket is assigned to." },
        "ticket.priority": { "label": "Priority", "description": "The priority level of the ticket.", "type": "enum", "values": { "1": "Low", "2": "Medium", "3": "High", "4": "Urgent" }, "example": "1 (Low)" },
        "ticket.requester_id": { "label": "Requester ID", "description": "The unique ID of the user who raised the ticket." },
        "ticket.responder_id": { "label": "Responder ID", "description": "The unique ID of the agent who last responded to the ticket." },
        "ticket.source": { "label": "Source", "description": "The channel through which the ticket was created.", "type": "enum", "values": { "1": "Email", "2": "Portal", "14": "Alerts" }, "example": "2 (Portal)" },
        "ticket.status": { "label": "Status", "description": "The current status of the ticket.", "type": "enum", "values": { "2": "Open", "3": "Pending", "4": "Resolved", "5": "Closed" }, "example": "2 (Open)" },
        "ticket.subject": { "label": "Subject", "description": "The subject line of the ticket." },
        "ticket.type": { "label": "Type", "description": "The type of ticket (e.g., Incident, Service Request)." },
        "ticket.due_by": { "label": "Due By", "description": "The timestamp by which the ticket is due to be resolved." },
        "ticket.fr_due_by": { "label": "First Response Due By", "description": "The timestamp by which the first response is due." },
        "ticket.is_escalated": { "label": "Is Escalated", "description": "Indicates if the ticket has been escalated.", "type": "boolean", "example": "false" },
        "ticket.description_text": { "label": "Description (Text)", "description": "The plain text content of the ticket's description." },
        "ticket.created_at": { "label": "Created At", "description": "The timestamp when the ticket was created." },
        "ticket.updated_at": { "label": "Updated At", "description": "The timestamp when the ticket was last updated." },
        "ticket.tags": { "label": "Tags", "description": "Tags associated with the ticket." },
        "ticket.custom_fields.categories": { "label": "Categories", "description": "Custom field for categorizing the ticket." },
        "ticket.custom_fields.cf_123": { "label": "Vendor/Product", "description": "Custom field for Vendor or Product classification." },
        "ticket.custom_fields.cf_456": { "label": "Vendor/Product Sub-Category", "description": "Custom field for Vendor or Product sub-classification." },
        "ticket.custom_fields.environment": { "label": "Environment", "description": "The environment the ticket relates to (e.g., Production, Lab)." },
        "ticket.custom_fields.impact": { "label": "Customer Impact", "description": "The level of impact on the customer." },
        "ticket.custom_fields.incident_type": { "label": "Incident Type", "description": "The type of incident reported." },
        "ticket.custom_fields.module": { "label": "Module", "description": "The specific product module related to the ticket." },
        "ticket.custom_fields.platform_version": { "label": "Platform Version", "description": "The version of the platform being used." },
        "ticket.custom_fields.root_cause": { "label": "Root Cause", "description": "Custom field for the root cause of the issue." },
        "ticket.custom_fields.ticket_type": { "label": "Ticket Type", "description": "The primary classification of the ticket." },
        "ticket.custom_fields.what_is_affected": { "label": "What is Affected?", "description": "The specific area or feature affected." },
        "conversation.id": { "label": "Conversation ID", "description": "The unique identifier for the conversation entry." },
        "conversation.body_text": { "label": "Body (Text)", "description": "The plain text content of the conversation entry." },
        "conversation.user_id": { "label": "User ID", "description": "The ID of the user who created the conversation entry (agent or requester)." },
        "conversation.created_at": { "label": "Created At", "description": "The timestamp when the conversation entry was created." },
        "conversation.updated_at": { "label": "Updated At", "description": "The timestamp when the conversation entry was last updated." },
        "conversation.incoming": { "label": "Incoming", "description": "Indicates if the conversation entry was from the customer (true) or an agent (false).", "type": "boolean", "example": "false" },
        "conversation.private": { "label": "Is Private Note", "description": "Indicates if the conversation is a private note visible only to agents.", "type": "boolean", "example": "true" },
        "conversation.source": { "label": "Source Type", "description": "How the conversation was added. A 'source' of 2 combined with 'private:true' is a private note. If 'private:false', it is a public note.", "type": "enum", "values": { "0": "Reply", "2": "Note" }, "example": "2 (Note)" }
    }
};