select count(*), factor from revlog group by factor;
select count(*), factor from cards group by factor;
update cards set factor = 1500 where factor >= 1300;

### Ease factor

```sqlite
select count(*), factor
from revlog
group by factor;
select count(*), factor
from cards
group by factor;
update cards
set factor = 1500
where factor >= 1300;
```

https://github.com/ankidroid/Anki-Android/wiki/Database-Structure
https://kylerego.github.io/anki-schema
`revlog.id` is timestamp van review.
ease = review: 1 wrong, 2 hard, 3 ok, 4 easy
type = 0 learn, 1 review, 2 relearn, 3 cram

```sqlite
with hard as (select datetime(id / 1000, 'unixepoch') as 'datetime', *
              from revlog
              where id / 1000 > unixepoch(date('now', '-1 month'))
                and type = 1
                and ease = 2
                and ivl > 21
              order by id desc)
-- update cards  set flags = 2, usn = -1 from hard as h where cards.id = h.cid;
select *
from cards as c,
     hard as h
where h.cid = c.id;


select unixepoch(date('now', '-1 month'))
```

### Hard answers last week

```sqlite
with hard as (select datetime(id / 1000, 'unixepoch')                                as 'datetime',
                     cast(strftime('%Y%W', datetime(id / 1000, 'unixepoch')) as int) as 'weeknr',
                     *
              from revlog
              where weeknr > cast(strftime('%Y%W', date('now')) as int) - 5
                and type = 1
                and ease = 2
                and ivl > 14
              order by id desc)

select *
from cards as c,
     hard as h
where h.cid = c.id;
```

### Flag as yellow

```sqlite
update cards
set flags = 2,
    usn   = -1
from hard as h
where cards.id = h.cid
```
