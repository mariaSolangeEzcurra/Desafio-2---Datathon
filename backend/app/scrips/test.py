import psycopg2

try:
    conn = psycopg2.connect(
        dbname="db_operaciones_sedapar",
        user="admin_sedapar",
        password="password_seguro_2026",
        host="localhost",
        port="5432"
    )
    print("✅ Conexión exitosa")
    conn.close()
except Exception as e:
    print("❌ Error:", e)