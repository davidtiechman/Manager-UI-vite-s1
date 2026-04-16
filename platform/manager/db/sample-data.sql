-- Insert some sample agents for testing
INSERT INTO agents_status (
  id, status, selected_link, unit, unit_code, zayad_id, call_sign,
  platform_id, platform_name, messages_in_queue, link_type, link_available, link_quality,
  latency, reliability, scheduler_mode, next_delivery_time, server_lut
) VALUES
  ('ag-101', 'online', 'satcom', 'פיקוד צפון', 'N-001', 'Z-101', 'N-ALPHA',
   'plat-101', 'Platform Alpha', 2, 'satcom', true, 0.98, 72, 0.98, 'auto', NOW() + INTERVAL '5 minutes', NOW()),
  ('ag-204', 'warning', 'lte', 'ממסר מזרח', 'E-002', 'Z-204', 'E-ROOK',
   'plat-204', 'Platform Beta', 14, 'lte', true, 0.86, 181, 0.86, 'manual', NOW() + INTERVAL '10 minutes', NOW()),
  ('ag-309', 'online', 'rf', 'מבצעי ים', 'SEA-003', 'Z-309', 'SEA-77',
   'plat-309', 'Platform Gamma', 6, 'rf', true, 0.92, 104, 0.92, 'auto', NOW() + INTERVAL '3 minutes', NOW()),
  ('ag-412', 'offline', 'satcom', 'צומת מערב', 'W-004', 'Z-412', 'W-HALO',
   'plat-412', 'Platform Delta', 27, 'satcom', false, 0.51, 350, 0.51, 'auto', NOW() + INTERVAL '15 minutes', NOW())
ON CONFLICT (id) DO NOTHING;