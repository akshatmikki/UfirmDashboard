const AllBanks = [
  { label: "AU Small Finance Bank", value: "AU Small Finance Bank" },
  { label: "Axis Bank", value: "Axis Bank" },
  { label: "Bandhan Bank", value: "Bandhan Bank" },
  { label: "Bank of Baroda", value: "Bank of Baroda" },
  { label: "Bank of India", value: "Bank of India" },
  { label: "Bank of Maharashtra", value: "Bank of Maharashtra" },
  { label: "Canara Bank", value: "Canara Bank" },
  { label: "Central Bank of India", value: "Central Bank of India" },
  { label: "City Union Bank", value: "City Union Bank" },
  { label: "CSB Bank", value: "CSB Bank" },
  { label: "DCB Bank", value: "DCB Bank" },
  { label: "Dhanlaxmi Bank", value: "Dhanlaxmi Bank" },
  { label: "Equitas Small Finance Bank", value: "Equitas Small Finance Bank" },
  { label: "HDFC Bank", value: "HDFC Bank" },
  { label: "ICICI Bank", value: "ICICI Bank" },
  { label: "IDFC First Bank", value: "IDFC First Bank" },
  { label: "Indian Bank", value: "Indian Bank" },
  { label: "Indian Overseas Bank", value: "Indian Overseas Bank" },
  { label: "IndusInd Bank", value: "IndusInd Bank" },
  { label: "Jammu & Kashmir Bank", value: "Jammu & Kashmir Bank" },
  { label: "Jana Small Finance Bank", value: "Jana Small Finance Bank" },
  { label: "Karnataka Bank", value: "Karnataka Bank" },
  { label: "Karur Vysya Bank", value: "Karur Vysya Bank" },
  { label: "Kotak Mahindra Bank", value: "Kotak Mahindra Bank" },
  { label: "Punjab & Sind Bank", value: "Punjab & Sind Bank" },
  { label: "Punjab National Bank", value: "Punjab National Bank" },
  { label: "RBL Bank", value: "RBL Bank" },
  { label: "South Indian Bank", value: "South Indian Bank" },
  { label: "State Bank of India", value: "State Bank of India" },
  { label: "Tamilnad Mercantile Bank", value: "Tamilnad Mercantile Bank" },
  { label: "UCO Bank", value: "UCO Bank" },
  { label: "Union Bank of India", value: "Union Bank of India" },
  { label: "Ujjivan Small Finance Bank", value: "Ujjivan Small Finance Bank" },
  { label: "Yes Bank", value: "Yes Bank" }
];
const extraBanks = [
  { label: "Nainital Bank", value: "Nainital Bank" },
  { label: "Saraswat Bank", value: "Saraswat Bank" },
  { label: "Shamrao Vithal Co-operative Bank", value: "Shamrao Vithal Co-operative Bank" },
  { label: "Abhyudaya Co-operative Bank", value: "Abhyudaya Co-operative Bank" },
  { label: "Cosmos Bank", value: "Cosmos Bank" },
  { label: "NKGSB Co-operative Bank", value: "NKGSB Co-operative Bank" },
  { label: "Janata Sahakari Bank", value: "Janata Sahakari Bank" },
  { label: "TJSB Sahakari Bank", value: "TJSB Sahakari Bank" },

  // Payments Banks
  { label: "Airtel Payments Bank", value: "Airtel Payments Bank" },
  { label: "India Post Payments Bank", value: "India Post Payments Bank" },
  { label: "Paytm Payments Bank", value: "Paytm Payments Bank" },
  { label: "Fino Payments Bank", value: "Fino Payments Bank" },
  { label: "Jio Payments Bank", value: "Jio Payments Bank" },

  // Foreign banks (commonly used in India)
  { label: "HSBC Bank", value: "HSBC Bank" },
  { label: "Citibank", value: "Citibank" },
  { label: "Standard Chartered Bank", value: "Standard Chartered Bank" },
  { label: "Deutsche Bank", value: "Deutsche Bank" },
  { label: "DBS Bank", value: "DBS Bank" },
  { label: "Barclays Bank", value: "Barclays Bank" },
  { label: "Bank of America", value: "Bank of America" }
];
// optional but smart (sorted list)
const AllBanksFinal = [...AllBanks, ...extraBanks];

const SortedBanks = [...AllBanksFinal].sort((a, b) =>
  a.label.localeCompare(b.label)
);

export default SortedBanks;