"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { topPosts, type Post } from "@/lib/connex-data"

const typeVariant: Record<Post["type"], string> = {
  Reel: "bg-accent text-accent-foreground",
  Carrossel: "bg-success/10 text-success",
  Imagem: "bg-warning/10 text-warning",
  Story: "bg-muted text-muted-foreground",
}

export function TopPosts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Posts com Melhor Desempenho</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          Publicações com maior alcance e engajamento no período.
        </p>
      </CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Publicação</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Alcance</TableHead>
                <TableHead className="text-right">Curtidas</TableHead>
                <TableHead className="hidden text-right md:table-cell">Comentários</TableHead>
                <TableHead className="hidden text-right md:table-cell">Compart.</TableHead>
                <TableHead className="pr-6 text-right">Engaj.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topPosts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <img
                        src={post.thumb || "/placeholder.svg"}
                        alt=""
                        className="size-10 shrink-0 rounded-md object-cover"
                      />
                      <span className="max-w-[200px] truncate text-sm font-medium">{post.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={typeVariant[post.type]}>
                      {post.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{post.date}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{post.reach}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{post.likes}</TableCell>
                  <TableCell className="hidden text-right text-sm tabular-nums md:table-cell">
                    {post.comments}
                  </TableCell>
                  <TableCell className="hidden text-right text-sm tabular-nums md:table-cell">
                    {post.shares}
                  </TableCell>
                  <TableCell className="pr-6 text-right text-sm font-semibold tabular-nums text-success">
                    {post.engagement}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
