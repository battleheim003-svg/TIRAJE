/**
 * 31 Provinces of Iran with Persian and English names.
 */

export interface IranProvince {
  nameFa: string
  nameEn: string
}

export const IRAN_PROVINCES: readonly IranProvince[] = [
  { nameFa: "آذربایجان شرقی", nameEn: "East Azerbaijan" },
  { nameFa: "آذربایجان غربی", nameEn: "West Azerbaijan" },
  { nameFa: "اردبیل", nameEn: "Ardabil" },
  { nameFa: "اصفهان", nameEn: "Isfahan" },
  { nameFa: "البرز", nameEn: "Alborz" },
  { nameFa: "ایلام", nameEn: "Ilam" },
  { nameFa: "بوشهر", nameEn: "Bushehr" },
  { nameFa: "تهران", nameEn: "Tehran" },
  { nameFa: "چهارمحال و بختیاری", nameEn: "Chaharmahal and Bakhtiari" },
  { nameFa: "خراسان جنوبی", nameEn: "South Khorasan" },
  { nameFa: "خراسان رضوی", nameEn: "Razavi Khorasan" },
  { nameFa: "خراسان شمالی", nameEn: "North Khorasan" },
  { nameFa: "خوزستان", nameEn: "Khuzestan" },
  { nameFa: "زنجان", nameEn: "Zanjan" },
  { nameFa: "سمنان", nameEn: "Semnan" },
  { nameFa: "سیستان و بلوچستان", nameEn: "Sistan and Baluchestan" },
  { nameFa: "فارس", nameEn: "Fars" },
  { nameFa: "قزوین", nameEn: "Qazvin" },
  { nameFa: "قم", nameEn: "Qom" },
  { nameFa: "کردستان", nameEn: "Kurdistan" },
  { nameFa: "کرمان", nameEn: "Kerman" },
  { nameFa: "کرمانشاه", nameEn: "Kermanshah" },
  { nameFa: "کهگیلویه و بویراحمد", nameEn: "Kohgiluyeh and Boyer-Ahmad" },
  { nameFa: "گلستان", nameEn: "Golestan" },
  { nameFa: "گیلان", nameEn: "Gilan" },
  { nameFa: "لرستان", nameEn: "Lorestan" },
  { nameFa: "مازندران", nameEn: "Mazandaran" },
  { nameFa: "مرکزی", nameEn: "Markazi" },
  { nameFa: "هرمزگان", nameEn: "Hormozgan" },
  { nameFa: "همدان", nameEn: "Hamedan" },
  { nameFa: "یزد", nameEn: "Yazd" },
] as const

export const IRAN_PROVINCE_NAMES_FA = IRAN_PROVINCES.map((p) => p.nameFa)
