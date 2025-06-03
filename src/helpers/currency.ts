export const formatCurrencyInCents = (amount: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount / 100);
};

export const parseCurrencyToCents = (value: string): number => {
  // Remove todos os caracteres que não são dígitos ou vírgula/ponto
  const cleanValue = value.replace(/[^\d,.-]/g, '');
  
  // Substitui vírgula por ponto para conversão numérica
  const normalizedValue = cleanValue.replace(',', '.');
  
  // Converte para número e multiplica por 100 para obter centavos
  const numberValue = parseFloat(normalizedValue) || 0;
  
  return Math.round(numberValue * 100);
};
