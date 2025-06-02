const { drizzle } = require('drizzle-orm/postgres-js');
const { eq } = require('drizzle-orm');
const postgres = require('postgres');
require('dotenv').config();

// Configuração do banco
const sql = postgres(process.env.DATABASE_URL);
const db = drizzle(sql);

// Schema simplificado
const usersTable = {
  id: 'id',
  userType: 'user_type',
  mustChangePassword: 'must_change_password',
  updatedAt: 'updated_at'
};

async function updateExistingDoctors() {
  try {
    console.log('🔄 Atualizando médicos existentes para forçar alteração de senha...');
    
    // Atualizar todos os usuários do tipo "doctor" para mustChangePassword = true
    const result = await db
      .update(usersTable)
      .set({
        mustChangePassword: true,
        updatedAt: new Date()
      })
      .where(eq(usersTable.userType, 'doctor'));
    
    console.log(`✅ ${result.rowCount || 0} médicos atualizados com sucesso!`);
    console.log('📋 Todos os médicos agora precisarão alterar a senha no próximo login.');
    
  } catch (error) {
    console.error('❌ Erro ao atualizar médicos:', error);
  } finally {
    await sql.end();
  }
}

updateExistingDoctors(); 