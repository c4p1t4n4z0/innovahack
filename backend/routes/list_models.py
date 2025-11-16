import google.generativeai as genai
import os

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

print("Modelos disponibles:\n")
for m in genai.list_models():
    print(m.name, " |  soporta generating:", "generateContent" in m.supported_generation_methods)
