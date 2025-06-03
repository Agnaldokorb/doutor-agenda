-- ===== VIEWS PARA SISTEMA DE FATURAMENTO =====
-- Criado para otimizar consultas de relatórios financeiros

-- View 1: Faturamento Diário
CREATE OR REPLACE VIEW daily_revenue_view AS
SELECT 
    DATE(ap.created_at) as date,
    ap.clinic_id,
    SUM(pt.amount_in_cents) as total_amount_in_cents,
    COUNT(pt.id) as total_transactions,
    AVG(pt.amount_in_cents)::integer as average_transaction_in_cents
FROM appointment_payments ap
INNER JOIN payment_transactions pt ON ap.id = pt.appointment_payment_id
WHERE ap.status = 'pago'
GROUP BY DATE(ap.created_at), ap.clinic_id
ORDER BY date DESC;

-- View 2: Faturamento por Método de Pagamento
CREATE OR REPLACE VIEW payment_method_revenue_view AS
SELECT 
    DATE(ap.created_at) as date,
    ap.clinic_id,
    pt.payment_method,
    SUM(pt.amount_in_cents) as total_amount_in_cents,
    COUNT(pt.id) as transaction_count
FROM appointment_payments ap
INNER JOIN payment_transactions pt ON ap.id = pt.appointment_payment_id
WHERE ap.status = 'pago'
GROUP BY DATE(ap.created_at), ap.clinic_id, pt.payment_method
ORDER BY date DESC, total_amount_in_cents DESC;

-- View 3: Faturamento Mensal
CREATE OR REPLACE VIEW monthly_revenue_view AS
SELECT 
    EXTRACT(YEAR FROM ap.created_at)::integer as year,
    EXTRACT(MONTH FROM ap.created_at)::integer as month,
    ap.clinic_id,
    SUM(pt.amount_in_cents) as total_amount_in_cents,
    COUNT(pt.id) as total_transactions,
    COUNT(DISTINCT a.doctor_id) as total_doctors,
    COUNT(DISTINCT a.patient_id) as total_patients
FROM appointment_payments ap
INNER JOIN payment_transactions pt ON ap.id = pt.appointment_payment_id
INNER JOIN appointments a ON ap.appointment_id = a.id
WHERE ap.status = 'pago'
GROUP BY EXTRACT(YEAR FROM ap.created_at), EXTRACT(MONTH FROM ap.created_at), ap.clinic_id
ORDER BY year DESC, month DESC;

-- View 4: Faturamento por Médico
CREATE OR REPLACE VIEW doctor_revenue_view AS
SELECT 
    d.id as doctor_id,
    d.name as doctor_name,
    d.specialty,
    d.clinic_id,
    SUM(pt.amount_in_cents) as total_amount_in_cents,
    COUNT(a.id) as total_appointments,
    AVG(pt.amount_in_cents)::integer as average_appointment_value_in_cents,
    MAX(a.date) as last_appointment_date
FROM doctors d
INNER JOIN appointments a ON d.id = a.doctor_id
INNER JOIN appointment_payments ap ON a.id = ap.appointment_id
INNER JOIN payment_transactions pt ON ap.id = pt.appointment_payment_id
WHERE ap.status = 'pago'
GROUP BY d.id, d.name, d.specialty, d.clinic_id
ORDER BY total_amount_in_cents DESC;

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_appointment_payments_created_at ON appointment_payments(created_at);
CREATE INDEX IF NOT EXISTS idx_appointment_payments_clinic_status ON appointment_payments(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_method ON payment_transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments(doctor_id, date); 