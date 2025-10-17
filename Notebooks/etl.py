import json
from bs4 import BeautifulSoup

# Carrega o GeoJSON que veio do KML
with open("../Data/Row/Bairros GeoJSON.geojson", "r", encoding="utf-8") as f:
    data = json.load(f)

clean_features = []

for feature in data["features"]:
    props = feature.get("properties", {})
    desc = props.get("description", "")

    # Usa BeautifulSoup para limpar tags HTML
    soup = BeautifulSoup(desc, "html.parser")
    text = soup.get_text(separator="|")  # separa campos por '|'

    # Aqui você extrai os campos do description
    # Ex: se description tinha "name: Centro|color: #ff0000"
    fields = text.split("|")
    clean_props = {}
    for field in fields:
        if ":" in field:
            key, value = field.split(":", 1)
            clean_props[key.strip().lower()] = value.strip()

    # Mantém geometria e adiciona propriedades limpas
    clean_features.append({
        "type": "Feature",
        "geometry": feature["geometry"],
        "properties": clean_props
    })

# Salva o GeoJSON limpo
clean_geojson = {
    "type": "FeatureCollection",
    "features": clean_features
}

with open("bairros_clean.geojson", "w", encoding="utf-8") as f:
    json.dump(clean_geojson, f, ensure_ascii=False, indent=2)

print("GeoJSON limpo gerado: bairros_clean.geojson")
