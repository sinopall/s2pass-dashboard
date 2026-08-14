package main
import (
	"context"
	"fmt"
	"log"
	"github.com/jackc/pgx/v5"
)
func main() {
	conn, err := pgx.Connect(context.Background(), "postgres://postgres:postgres@localhost:5432/s2pas?sslmode=disable")
	if err != nil { log.Fatal(err) }
	defer conn.Close(context.Background())
	rows, err := conn.Query(context.Background(), `SELECT id, name FROM categories`)
	if err != nil { log.Fatal(err) }
	for rows.Next() {
		var id int
		var name string
		rows.Scan(&id, &name)
		fmt.Println(id, ":", name)
	}
}
