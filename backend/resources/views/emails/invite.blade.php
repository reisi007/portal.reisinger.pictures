<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Einladung zur Galerie</title>
</head>
<body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2A9D8F;">Hallo!</h2>
        
        <p>Deine Bilder sind fertig! Du wurdest eingeladen, dir die Galerie <strong>{{ $galleryName }}</strong> anzusehen.</p>
        
        <p>Über den folgenden Link kannst du die Galerie öffnen, deine Auswahl treffen und Favoriten markieren:</p>
        
        <p style="margin: 30px 0;">
            <a href="{{ $inviteLink }}" style="background-color: #2A9D8F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Hier klicken, um zur Galerie zu gelangen
            </a>
        </p>
        
        <p style="font-size: 0.9em; color: #666;">
            Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:<br>
            <a href="{{ $inviteLink }}" style="color: #2A9D8F;">{{ $inviteLink }}</a>
        </p>
        
        <p style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
            Liebe Grüße,<br>
            Dein Fotograf
        </p>
    </div>
</body>
</html>
