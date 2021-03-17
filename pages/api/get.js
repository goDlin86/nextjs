import faunadb, { query as q } from 'faunadb'
import dayjs from 'dayjs'

export default async (req, res) => {
    const { cursor } = req.query

    const client = new faunadb.Client({ secret: process.env.DBSECRET })
    
    let data = {}
    if (cursor) {
        const after = cursor.split("_")
        data = await client.query(
            q.Map(
                q.Paginate(
                    q.Match(q.Index("dateDesc")), 
                    { 
                        size: 8,
                        after: [ after[0], q.Ref(q.Collection("AlbumEntry"), after[1]), q.Ref(q.Collection("AlbumEntry"), after[1]) ]
                    }
                ),
                q.Lambda((x, ref) => q.Get(ref))
            )
        )
    }
    else
        data = await client.query(
            q.Map(
                q.Paginate(
                    q.Match(q.Index("dateDesc")), 
                    { size: 8 }
                ),
                q.Lambda((x, ref) => q.Get(ref))
            )
        )

    let albums = data['data'].map(a => a['data'])
    albums = albums.map(a => {
        a.date = dayjs(a.date).format('DD MMM YYYY')
        return a
    })

    let after = ''
    if (data['after'])
        after = data['after'][0] + '_' + data['after'][1]['value'].id
    
    res.status(200).json({ albums, after })
}