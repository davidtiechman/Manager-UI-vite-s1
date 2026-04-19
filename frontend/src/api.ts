import type { AgentStatus } from './types';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000';

// Fallback mock data if API fails
const MOCK_AGENTS: AgentStatus[] = [
    {
        id: 'ag-101',
        status: 'online',
        selected_link: 'satcom',
        unit: 'פיקוד צפון',
        unit_code: 'N-001',
        zayad_id: 'Z-101',
        call_sign: 'N-ALPHA',
        platform_id: 'plat-101',
        platform_name: 'Platform Alpha',
        messages_in_queue: 2,
        link_type: 'satcom',
        link_available: true,
        link_quality: 0.98,
        latency: 72,
        reliability: 0.98,
        link_timestamp: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        nextDeliveryTime: new Date().toISOString(),
        serverLut: new Date().toISOString(),
    },
    {
        id: 'ag-204',
        status: 'warning',
        selected_link: 'lte',
        unit: 'ממסר מזרח',
        unit_code: 'E-002',
        zayad_id: 'Z-204',
        call_sign: 'E-ROOK',
        platform_id: 'plat-204',
        platform_name: 'Platform Beta',
        messages_in_queue: 14,
        link_type: 'lte',
        link_available: true,
        link_quality: 0.86,
        latency: 181,
        reliability: 0.86,
        link_timestamp: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        nextDeliveryTime: new Date().toISOString(),
        serverLut: new Date().toISOString(),
    },
];

export class ApiService {
    static async getAgents(): Promise<AgentStatus[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/ui/agents`, { timeout: 5000 });
            if (!response.ok) {
                console.warn('API returned error, using mock data');
                return MOCK_AGENTS;
            }
            const data = await response.json();
            return data && Array.isArray(data) ? data : MOCK_AGENTS;
        } catch (error) {
            console.warn('Failed to fetch agents from API, using mock data:', error);
            return MOCK_AGENTS;
        }
    }

    static async getAgentHistory(agentId: string, limit: number = 100): Promise<any[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/ui/agents/${agentId}/history?limit=${limit}`, { timeout: 5000 });
            if (!response.ok) {
                return [];
            }
            const data = await response.json();
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.warn('Failed to fetch agent history:', error);
            return [];
        }
    }
}