export interface TicketBuyerInput {
  name: string;
  phone: string;
  document: string;
}

export const EMPTY_BUYER: TicketBuyerInput = { name: "", phone: "", document: "" };

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  const areaCode = digits.slice(0, 2);
  const number = digits.slice(2);
  const splitAt = number.length > 8 ? 5 : 4;
  return number.length <= splitAt
    ? `(${areaCode}) ${number}`
    : `(${areaCode}) ${number.slice(0, splitAt)}-${number.slice(splitAt)}`;
}

export function formatCpf(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

export function maskCpf(digits: string): string {
  return digits.length === 11 ? `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**` : digits;
}

export function isBuyerIdentified(buyer: TicketBuyerInput): boolean {
  return onlyDigits(buyer.phone).length >= 10 || onlyDigits(buyer.document).length === 11;
}

export function toBuyerPayload(buyer: TicketBuyerInput) {
  return {
    name: buyer.name.trim() || undefined,
    phone: onlyDigits(buyer.phone) || undefined,
    document: onlyDigits(buyer.document) || undefined,
  };
}
