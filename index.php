<!DOCTYPE html>
<html>
<head>
    <title>Triskel QR</title>
    <meta charset="UTF-8">
</head>
<body style="background:#111;color:#fff;font-family:sans-serif;text-align:center;">

    <h2>Generar QR</h2>

    <form action="generate.php" method="POST">
        <textarea name="text" placeholder="Ej: Baño a la derecha" required
            style="width:300px;height:80px;"></textarea>

        <br><br>

        <select name="type">
            <option value="plain">QR Plano (offline)</option>
            <option value="smart">QR Inteligente (URL)</option>
        </select>

        <br><br>

        <button type="submit">Generar</button>
    </form>

</body>
</html>