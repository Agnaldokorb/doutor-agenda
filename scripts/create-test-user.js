#!/usr/bin/env node

const { auth } = require('../src/lib/auth.ts');

async function createTestUser() {
  try {
    console.log('🧪 Criando usuário de teste...');
    
    const userData = {
      name: 'Admin Teste',
      email: 'admin@teste.com',
      password: '123456789'
    };
    
    console.log('📧 Dados do usuário:', userData);
    
    // Criar usuário usando BetterAuth
    const result = await auth.api.signUpEmail({
      body: userData
    });
    
    console.log('✅ Usuário criado:', result);
    
    // Também podemos tentar fazer login para testar
    const loginResult = await auth.api.signInEmail({
      body: {
        email: userData.email,
        password: userData.password
      }
    });
    
    console.log('🔐 Login teste:', loginResult);
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
  }
}

createTestUser(); 