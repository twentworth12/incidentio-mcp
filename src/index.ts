#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate environment variables
const API_KEY = process.env.INCIDENTIO_API_KEY;
if (!API_KEY) {
  console.error('Error: INCIDENTIO_API_KEY environment variable is required');
  process.exit(1);
}

const API_BASE_URL = process.env.INCIDENTIO_API_BASE_URL || 'https://api.incident.io';

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Define available tools
const TOOLS: Tool[] = [
  {
    name: 'list_severities',
    description: 'List available severity levels in incident.io',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_incident_types',
    description: 'List available incident types in incident.io',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_incidents',
    description: 'List incidents from incident.io',
    inputSchema: {
      type: 'object',
      properties: {
        page_size: {
          type: 'number',
          description: 'Number of incidents to return per page',
          default: 25,
        },
        status: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['triage', 'investigating', 'monitoring', 'closed', 'declined'],
          },
          description: 'Filter by incident status',
        },
        severity: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Filter by severity',
        },
      },
    },
  },
  {
    name: 'create_incident',
    description: 'Create a new incident in incident.io',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the incident',
        },
        summary: {
          type: 'string',
          description: 'Summary of the incident',
        },
        severity_id: {
          type: 'string',
          description: 'ID of the severity level',
        },
        incident_type_id: {
          type: 'string',
          description: 'ID of the incident type',
        },
        custom_field_entries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              custom_field_id: {
                type: 'string',
              },
              values: {
                type: 'array',
                items: {
                  type: 'object',
                },
              },
            },
          },
          description: 'Custom field entries',
        },
      },
      required: ['name', 'severity_id', 'incident_type_id'],
    },
  },
  {
    name: 'get_incident',
    description: 'Get details of a specific incident',
    inputSchema: {
      type: 'object',
      properties: {
        incident_id: {
          type: 'string',
          description: 'ID of the incident to retrieve',
        },
      },
      required: ['incident_id'],
    },
  },
  {
    name: 'update_incident',
    description: 'Update an existing incident',
    inputSchema: {
      type: 'object',
      properties: {
        incident_id: {
          type: 'string',
          description: 'ID of the incident to update',
        },
        name: {
          type: 'string',
          description: 'Updated name of the incident',
        },
        summary: {
          type: 'string',
          description: 'Updated summary of the incident',
        },
        status: {
          type: 'string',
          enum: ['triage', 'investigating', 'monitoring', 'closed', 'declined'],
          description: 'Updated status of the incident',
        },
        severity_id: {
          type: 'string',
          description: 'Updated severity ID',
        },
      },
      required: ['incident_id'],
    },
  },
  {
    name: 'update_incident_role',
    description: 'Assign or update a role (like Incident Lead) for an incident',
    inputSchema: {
      type: 'object',
      properties: {
        incident_id: {
          type: 'string',
          description: 'ID of the incident',
        },
        role_id: {
          type: 'string',
          description: 'ID of the role (e.g., for Incident Lead)',
        },
        user_id: {
          type: 'string',
          description: 'ID of the user to assign to the role',
        },
        notify_incident_channel: {
          type: 'boolean',
          description: 'Whether to notify the incident channel (default: true)',
          default: true,
        },
      },
      required: ['incident_id', 'role_id', 'user_id'],
    },
  },
  {
    name: 'list_incident_roles',
    description: 'List available incident roles',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_users',
    description: 'List users in the organization',
    inputSchema: {
      type: 'object',
      properties: {
        page_size: {
          type: 'number',
          description: 'Number of users to return per page',
          default: 25,
        },
      },
    },
  },
  {
    name: 'list_incident_updates',
    description: 'List updates for an incident',
    inputSchema: {
      type: 'object',
      properties: {
        incident_id: {
          type: 'string',
          description: 'ID of the incident',
        },
        page_size: {
          type: 'number',
          description: 'Number of updates to return per page',
          default: 25,
        },
      },
      required: ['incident_id'],
    },
  },
  {
    name: 'list_follow_ups',
    description: 'List follow-ups, optionally filtered by incident',
    inputSchema: {
      type: 'object',
      properties: {
        incident_id: {
          type: 'string',
          description: 'Filter follow-ups by incident ID',
        },
        page_size: {
          type: 'number',
          description: 'Number of follow-ups to return per page',
          default: 25,
        },
      },
    },
  },
  {
    name: 'get_follow_up',
    description: 'Get details of a specific follow-up',
    inputSchema: {
      type: 'object',
      properties: {
        follow_up_id: {
          type: 'string',
          description: 'ID of the follow-up',
        },
      },
      required: ['follow_up_id'],
    },
  },
  {
    name: 'list_workflows',
    description: 'List workflows in your organization',
    inputSchema: {
      type: 'object',
      properties: {
        page_size: {
          type: 'number',
          description: 'Number of workflows to return per page',
          default: 25,
        },
      },
    },
  },
  {
    name: 'list_schedules',
    description: 'List schedules in your organization',
    inputSchema: {
      type: 'object',
      properties: {
        page_size: {
          type: 'number',
          description: 'Number of schedules to return per page',
          default: 25,
        },
      },
    },
  },
  {
    name: 'list_catalog_types',
    description: 'List catalog types in your organization',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_catalog_entries',
    description: 'List catalog entries for a specific catalog type',
    inputSchema: {
      type: 'object',
      properties: {
        catalog_type_id: {
          type: 'string',
          description: 'ID of the catalog type (use list_catalog_types to get available types)',
        },
        page_size: {
          type: 'number',
          description: 'Number of entries to return per page',
          default: 25,
        },
      },
      required: ['catalog_type_id'],
    },
  },
  {
    name: 'list_custom_fields',
    description: 'List custom fields configured in your organization',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_incident_timestamps',
    description: 'List available incident timestamp types',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: 'incidentio-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.error('[REQUEST] List tools');
  return { tools: TOOLS };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  console.error(`[REQUEST] Call tool: ${name}`, args ? JSON.stringify(args) : 'no args');

  try {
    switch (name) {
      case 'list_incidents': {
        const params = new URLSearchParams();
        if (args?.page_size) params.append('page_size', args.page_size.toString());
        if (args?.status && Array.isArray(args.status)) {
          args.status.forEach((s: string) => params.append('status[]', s));
        }
        if (args?.severity && Array.isArray(args.severity)) {
          args.severity.forEach((s: string) => params.append('severity[]', s));
        }

        const response = await apiClient.get(`/v2/incidents?${params.toString()}`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'create_incident': {
        if (!args?.name) {
          throw new Error('name is required for creating an incident');
        }
        if (!args?.severity_id) {
          throw new Error('severity_id is required for creating an incident. Use list_severities to see available options.');
        }
        if (!args?.incident_type_id) {
          throw new Error('incident_type_id is required for creating an incident. Use list_incident_types to see available options.');
        }
        
        const body: any = {
          name: args.name,
          mode: 'standard', // Default to standard mode
          severity_id: args.severity_id,
          incident_type_id: args.incident_type_id,
          visibility: 'public', // Default visibility
          idempotency_key: `inc-${Date.now()}-${Math.random().toString(36).substring(7)}`, // Generate unique key
        };

        if (args.summary) body.summary = args.summary;
        if (args.custom_field_entries) body.custom_field_entries = args.custom_field_entries;

        const response = await apiClient.post('/v2/incidents', body);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'get_incident': {
        if (!args?.incident_id) {
          throw new Error('incident_id is required');
        }
        
        const response = await apiClient.get(`/v2/incidents/${args.incident_id}`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'update_incident': {
        if (!args?.incident_id) {
          throw new Error('incident_id is required');
        }
        
        const body: any = {};
        if (args.name) body.name = args.name;
        if (args.summary) body.summary = args.summary;
        if (args.status) body.status = args.status;
        if (args.severity_id) body.severity_id = args.severity_id;

        const response = await apiClient.patch(`/v2/incidents/${args.incident_id}`, body);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'list_severities': {
        const response = await apiClient.get('/v1/severities');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'list_incident_types': {
        const response = await apiClient.get('/v1/incident_types');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'list_incident_roles': {
        const response = await apiClient.get('/v1/incident_roles');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'update_incident_role': {
        if (!args?.incident_id) {
          throw new Error('incident_id is required');
        }
        if (!args?.role_id) {
          throw new Error('role_id is required');
        }
        if (!args?.user_id) {
          throw new Error('user_id is required');
        }

        const body = {
          incident: {
            incident_role_assignments: [
              {
                incident_role_id: args.role_id,
                assignee: {
                  id: args.user_id,
                },
              }
            ],
          },
          notify_incident_channel: args.notify_incident_channel !== false, // Default to true
        };

        console.error(`[DEBUG] Updating incident role for incident ${args.incident_id}`);
        console.error(`[DEBUG] Role ID: ${args.role_id}, User ID: ${args.user_id}`);

        const response = await apiClient.post(`/v2/incidents/${args.incident_id}/actions/edit`, body);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }


      case 'list_users': {
        const params = new URLSearchParams();
        if (args?.page_size) params.append('page_size', args.page_size.toString());

        const response = await apiClient.get(`/v2/users?${params.toString()}`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'list_incident_updates': {
        if (!args?.incident_id) {
          throw new Error('incident_id is required');
        }

        const params = new URLSearchParams();
        params.append('incident_id', args.incident_id.toString());
        if (args?.page_size) params.append('page_size', args.page_size.toString());

        const response = await apiClient.get(`/v2/incident_updates?${params.toString()}`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'list_follow_ups': {
        const params = new URLSearchParams();
        if (args?.incident_id) params.append('incident_id', args.incident_id.toString());
        if (args?.page_size) params.append('page_size', args.page_size.toString());

        const response = await apiClient.get(`/v2/follow_ups?${params.toString()}`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'get_follow_up': {
        if (!args?.follow_up_id) {
          throw new Error('follow_up_id is required');
        }

        const response = await apiClient.get(`/v2/follow_ups/${args.follow_up_id}`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'list_workflows': {
        const params = new URLSearchParams();
        if (args?.page_size) params.append('page_size', args.page_size.toString());

        const response = await apiClient.get(`/v2/workflows?${params.toString()}`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'list_schedules': {
        const params = new URLSearchParams();
        if (args?.page_size) params.append('page_size', args.page_size.toString());

        const response = await apiClient.get(`/v2/schedules?${params.toString()}`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'list_catalog_types': {
        const response = await apiClient.get('/v2/catalog_types');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'list_catalog_entries': {
        if (!args?.catalog_type_id) {
          throw new Error('catalog_type_id is required');
        }

        const params = new URLSearchParams();
        params.append('catalog_type_id', args.catalog_type_id.toString());
        if (args?.page_size) params.append('page_size', args.page_size.toString());

        const response = await apiClient.get(`/v2/catalog_entries?${params.toString()}`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'list_custom_fields': {
        const response = await apiClient.get('/v2/custom_fields');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'list_incident_timestamps': {
        const response = await apiClient.get('/v2/incident_timestamps');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }


      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.message;
      const statusCode = error.response?.status;
      
      // Log rate limit headers if present
      if (statusCode === 429) {
        const headers = error.response?.headers;
        console.error('[RATE LIMIT] Hit rate limit!');
        console.error(`[RATE LIMIT] Retry-After: ${headers?.['retry-after'] || 'not specified'}`);
        console.error(`[RATE LIMIT] X-RateLimit-Limit: ${headers?.['x-ratelimit-limit'] || 'not specified'}`);
        console.error(`[RATE LIMIT] X-RateLimit-Remaining: ${headers?.['x-ratelimit-remaining'] || 'not specified'}`);
        console.error(`[RATE LIMIT] X-RateLimit-Reset: ${headers?.['x-ratelimit-reset'] || 'not specified'}`);
      }
      
      throw new Error(`incident.io API error (${statusCode}): ${errorMessage}`);
    }
    throw error;
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  
  // Add connection event logging
  transport.onclose = () => {
    console.error('[CONNECTION] Client disconnected');
  };
  
  await server.connect(transport);
  console.error('[CONNECTION] Server started, waiting for client connection');
  console.error('incident.io MCP server running');
  console.error(`API Base URL: ${API_BASE_URL}`);
  console.error(`API Key configured: ${API_KEY ? 'Yes' : 'No'}`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});