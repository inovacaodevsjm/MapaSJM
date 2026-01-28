import pandas as pd

# Recriando o DataFrame com os dados consolidados (2017-2023)
data = []

# --- DADOS: GÊNERO ---
gender_data = [
    (2023, 'Masculino', 344, 349, 313, 355), (2023, 'Feminino', 315, 349, 301, 350),
    (2022, 'Masculino', 363, 359, 326, 369), (2022, 'Feminino', 337, 365, 316, 366),
    (2021, 'Masculino', 351, 348, 316, 365), (2021, 'Feminino', 322, 338, 300, 346),
    (2020, 'Masculino', 226, 240, 209, 233), (2020, 'Feminino', 202, 235, 196, 223),
    (2019, 'Masculino', 537, 526, 486, 516), (2019, 'Feminino', 493, 522, 466, 499),
    (2018, 'Masculino', 557, 535, 497, 579), (2018, 'Feminino', 512, 525, 484, 565),
    (2017, 'Masculino', 540, 516, 514, 530), (2017, 'Feminino', 498, 510, 496, 509)
]
for row in gender_data:
    data.append([row[0], 'Gênero', row[1], row[2], row[3], row[4], row[5]])

# --- DADOS: LOCALIZAÇÃO ---
loc_data = [
    (2023, 'Urbana', 389, 400, 354, 404),
    (2022, 'Urbana', 388, 393, 356, 398),
    (2021, 'Urbana', 410, 408, 371, 418),
    (2020, 'Urbana', 307, 336, 287, 321), (2020, 'Rural', 574, 580, 530, 585),
    (2019, 'Urbana', 510, 519, 470, 501),
    (2018, 'Urbana', 530, 525, 487, 564), (2018, 'Rural', 598, 552, 444, 643),
    (2017, 'Urbana', 510, 502, 496, 509)
]
for row in loc_data:
    data.append([row[0], 'Localização', row[1], row[2], row[3], row[4], row[5]])

# --- DADOS: ADMINISTRAÇÃO ---
admin_data = [
    (2023, 'Federal', 529, 507, 435, 510), (2023, 'Estadual', 351, 351, 299, 351), (2023, 'Privada', 564, 525, 498, 537), (2023, 'Municipal', 101, 141, 100, 130),
    (2022, 'Federal', 587, 531, 498, 541), (2022, 'Estadual', 318, 337, 301, 339), (2022, 'Privada', 539, 515, 478, 528), (2022, 'Municipal', 0, 0, 0, 0),
    (2021, 'Federal', 585, 534, 521, 549), (2021, 'Estadual', 339, 352, 311, 358), (2021, 'Privada', 539, 510, 481, 531),
    (2020, 'Federal', 569, 521, 504, 530), (2020, 'Estadual', 243, 278, 231, 261), (2020, 'Privada', 446, 467, 408, 455), (2020, 'Municipal', 0, 0, 0, 0),
    (2019, 'Federal', 670, 590, 578, 597), (2019, 'Estadual', 488, 509, 457, 488), (2019, 'Privada', 563, 546, 501, 533),
    (2018, 'Federal', 695, 611, 592, 654), (2018, 'Estadual', 509, 512, 473, 552), (2018, 'Privada', 562, 549, 512, 586),
    (2017, 'Federal', 661, 583, 599, 619), (2017, 'Estadual', 493, 491, 484, 495), (2017, 'Privada', 552, 532, 524, 544)
]
for row in admin_data:
    data.append([row[0], 'Administração', row[1], row[2], row[3], row[4], row[5]])

df = pd.DataFrame(data, columns=['Ano', 'Categoria', 'Segmento', 'Matemática', 'Linguagens', 'Ciências Humanas', 'Ciências Sociais'])

# Salvando
file_path = 'Dados_ENEM_SJM_2017_2023.xlsx'
df.to_excel(file_path, index=False)

file_path

# ... (todo o código de criação do dataframe acima) ...

# Caminho completo (use 'r' antes das aspas para o Windows reconhecer as barras invertidas)
caminho_final = r"C:\Users\user\Desktop\Observatório de Dados\dados-criados\Dados_ENEM_SJM_2017_2023.xlsx"

# Salvar
df.to_excel(caminho_final, index=False)