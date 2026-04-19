Run :
    avant de faire le run :
        - drop de la base de donnée existante "culturo"
        - cree a nouveau la base de donnée "culturo"
        - npm run start:dev (dans le dossier api-culturo)
        - dans cmd : se connecter à la DB
            psql -h localhost -p 5432 -U postgres -d culturo
            $ mot de pass : root
        - se mettre dans le DB culturo
            \c culturo
        - verifier l'existance des tables dans la DB
            \d
        - copie contenu de fichier insert.sql et le coller dans la DB
        - verifier si les données sont présent avec des select des tables.


all user's password in 'Inserts' : 123456