/**
 * Chainable Supabase mock for testing
 */

type SupabaseRow = Record<string, any>;
type SupabaseTable = SupabaseRow[];
type SupabaseDatabase = Record<string, SupabaseTable>;

interface QueryResult<T = any> {
  data: T | null;
  error: { message: string } | null;
}

class QueryBuilder {
  private tableName: string;
  private db: SupabaseDatabase;
  private rows: SupabaseRow[];
  private filters: Array<(row: SupabaseRow) => boolean> = [];
  private orderBy: { col: string; ascending: boolean } | null = null;
  private limitCount: number | null = null;
  private isSingle = false;
  private isMaybeSingle = false;

  constructor(tableName: string, db: SupabaseDatabase) {
    this.tableName = tableName;
    this.db = db;
    this.rows = db[tableName] || [];
    // Mark if table doesn't exist for proper error handling
    (this as any).tableExists = tableName in db;
  }

  select(columns = '*') {
    // Check if columns contain joins (e.g., "*, profiles(display_name)")
    if (typeof columns === 'string' && columns.includes('(')) {
      this.handleJoins(columns);
    }
    return this;
  }

  private handleJoins(selectStr: string) {
    // Parse join syntax like: "id, user_id, profiles(display_name), autoscores(score_auto)"
    // Also handle: "profiles!submissions_user_id_fkey(display_name)"
    // And nested: "sponsor_members(profile_id, role, profiles(display_name, avatar_url))"
    
    const joins: Array<{ table: string; fields: string[]; nestedJoins?: Array<{ table: string; fields: string[] }> }> = [];
    
    // Find top-level joins with potential nested joins
    const joinPattern = /(\w+)(?:!\w+)?\(([^)]+(?:\([^)]+\))?[^)]*)\)/g;
    let match;
    
    while ((match = joinPattern.exec(selectStr)) !== null) {
      const table = match[1];
      const content = match[2];
      
      // Check if there are nested joins within this join
      const nestedJoinPattern = /(\w+)\(([^)]+)\)/g;
      const nestedJoins: Array<{ table: string; fields: string[] }> = [];
      let nestedMatch;
      const fieldsBeforeNested: string[] = [];
      
      let lastIndex = 0;
      let contentWithoutNested = content;
      
      while ((nestedMatch = nestedJoinPattern.exec(content)) !== null) {
        // Capture fields before this nested join
        const beforeText = content.substring(lastIndex, nestedMatch.index);
        beforeText.split(',').forEach(f => {
          const trimmed = f.trim();
          if (trimmed && !trimmed.includes('(')) {
            fieldsBeforeNested.push(trimmed);
          }
        });
        
        nestedJoins.push({
          table: nestedMatch[1],
          fields: nestedMatch[2].split(',').map(f => f.trim()),
        });
        
        // Remove nested join from content
        contentWithoutNested = contentWithoutNested.replace(nestedMatch[0], '');
        
        lastIndex = nestedMatch.index + nestedMatch[0].length;
      }
      
      // If nested joins were found, collect remaining fields
      if (nestedJoins.length > 0) {
        contentWithoutNested.split(',').forEach(f => {
          const trimmed = f.trim();
          if (trimmed && !trimmed.includes('(') && !trimmed.includes(')')) {
            fieldsBeforeNested.push(trimmed);
          }
        });
      }
      
      // If no nested joins were found, parse as simple comma-separated fields
      const fields = nestedJoins.length > 0 ? fieldsBeforeNested : content.split(',').map(f => f.trim());
      
      joins.push({
        table,
        fields,
        nestedJoins: nestedJoins.length > 0 ? nestedJoins : undefined,
      });
    }
    
    // Store joins for later use in execute
    (this as any).joins = joins;
  }

  eq(col: string, val: any) {
    this.filters.push((row) => row[col] === val);
    return this;
  }

  in(col: string, arr: any[]) {
    this.filters.push((row) => arr.includes(row[col]));
    return this;
  }

  or(exprString: string) {
    // Parse: 'title.ilike.%q%,brief_md.ilike.%q%'
    const parts = exprString.split(',');
    this.filters.push((row) => {
      return parts.some((part) => {
        const match = part.match(/(\w+)\.ilike\.%(.+)%/);
        if (match) {
          const [, field, search] = match;
          const value = row[field];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(search.toLowerCase());
          }
        }
        return false;
      });
    });
    return this;
  }

  contains(col: string, val: any) {
    this.filters.push((row) => {
      const rowVal = row[col];
      if (Array.isArray(rowVal) && Array.isArray(val)) {
        return val.some((v) => rowVal.includes(v));
      }
      return false;
    });
    return this;
  }

  order(col: string, options: { ascending?: boolean } = {}) {
    this.orderBy = { col, ascending: options.ascending !== false };
    return this;
  }

  limit(n: number) {
    this.limitCount = n;
    return this;
  }

  single() {
    this.isSingle = true;
    return this.execute();
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this.execute();
  }

  insert(rows: any | any[]) {
    const insertRows = Array.isArray(rows) ? rows : [rows];
    // Auto-generate IDs if not provided
    const rowsWithIds = insertRows.map((row) => ({
      id: row.id || `${this.tableName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: row.created_at || new Date().toISOString(),
      ...row,
    }));
    this.db[this.tableName].push(...rowsWithIds);
    return {
      select: () => ({
        single: () => ({
          data: rowsWithIds[0],
          error: null,
        }),
      }),
      data: rowsWithIds,
      error: null,
    };
  }

  upsert(rows: any | any[], options?: { onConflict?: string }) {
    const upsertRows = Array.isArray(rows) ? rows : [rows];
    const conflictKey = options?.onConflict;

    upsertRows.forEach((newRow) => {
      if (conflictKey && conflictKey in newRow) {
        const index = this.db[this.tableName].findIndex(
          (r) => r[conflictKey] === newRow[conflictKey]
        );
        if (index >= 0) {
          this.db[this.tableName][index] = { ...this.db[this.tableName][index], ...newRow };
        } else {
          this.db[this.tableName].push(newRow);
        }
      } else {
        this.db[this.tableName].push(newRow);
      }
    });

    // Return chainable result that supports both direct access and select()
    const result = {
      select: () => ({
        single: () => ({
          data: upsertRows[0],
          error: null,
        }),
      }),
      data: upsertRows,
      error: null,
    };

    return result;
  }

  update(patch: any) {
    return {
      eq: (col: string, val: any) => {
        const index = this.db[this.tableName].findIndex((r) => r[col] === val);
        if (index >= 0) {
          this.db[this.tableName][index] = { ...this.db[this.tableName][index], ...patch };
          return { data: this.db[this.tableName][index], error: null };
        }
        return { data: null, error: null };
      },
    };
  }

  private execute(): QueryResult {
    // If table doesn't exist in mockDb, return an error
    if (!(this as any).tableExists) {
      return { data: null, error: { message: `relation "${this.tableName}" does not exist` } };
    }

    let filtered = [...this.rows];

    // Apply filters
    for (const filter of this.filters) {
      filtered = filtered.filter(filter);
    }

    // Apply joins if any
    const joins = (this as any).joins || [];
    if (joins.length > 0) {
      filtered = filtered.map((row) => {
        const result = { ...row };
        for (const join of joins) {
          const joinTable = this.db[join.table] || [];
          
          // Check if this is a one-to-many relationship (array result)
          // Pattern: table_members, table_items, etc. - look for matching foreign keys
          const isOneToMany = join.table.endsWith('_members') || join.table.endsWith('_items') || 
                             joinTable.some((r: any) => r[`${this.tableName.slice(0, -1)}_id`] !== undefined);
          
          if (isOneToMany) {
            // One-to-many: find all matching rows
            // Try multiple foreign key patterns
            let fkInJoinTable = `${this.tableName.slice(0, -1)}_id`;
            
            // Special case: sponsor_orgs -> org_id (not sponsor_org_id)
            if (this.tableName === 'sponsor_orgs') {
              fkInJoinTable = 'org_id';
            }
            
            const relatedRows = joinTable.filter((r: any) => r[fkInJoinTable] === row.id);
            
            // Apply nested joins if specified
            if (join.nestedJoins && join.nestedJoins.length > 0) {
              result[join.table] = relatedRows.map((relatedRow: any) => {
                const nestedResult = { ...relatedRow };
                for (const nestedJoin of join.nestedJoins) {
                  const nestedTable = this.db[nestedJoin.table] || [];
                  const nestedFk = `${nestedJoin.table.slice(0, -1)}_id`;
                  const nestedRow = nestedTable.find((r: any) => r.id === relatedRow[nestedFk] || r.id === relatedRow.profile_id);
                  
                  if (nestedRow) {
                    if (nestedJoin.fields.includes('*')) {
                      nestedResult[nestedJoin.table] = nestedRow;
                    } else {
                      nestedResult[nestedJoin.table] = {};
                      for (const field of nestedJoin.fields) {
                        nestedResult[nestedJoin.table][field] = nestedRow[field];
                      }
                    }
                  } else {
                    nestedResult[nestedJoin.table] = null;
                  }
                }
                
                // Select only requested fields
                if (!join.fields.includes('*')) {
                  const filteredResult: any = {};
                  for (const field of join.fields) {
                    if (field in nestedResult) {
                      filteredResult[field] = nestedResult[field];
                    }
                  }
                  // Include nested tables
                  for (const nestedJoin of (join.nestedJoins || [])) {
                    filteredResult[nestedJoin.table] = nestedResult[nestedJoin.table];
                  }
                  return filteredResult;
                }
                
                return nestedResult;
              });
            } else {
              result[join.table] = relatedRows;
            }
          } else {
            // One-to-one or many-to-one relationship
            let relatedRow = null;
            
            // Try different foreign key patterns:
            // 1. Current table's id matches foreign table's <table_name>_id (e.g., submissions.id = autoscores.submission_id)
            const fkInJoinTable = `${this.tableName.slice(0, -1)}_id`;
            relatedRow = joinTable.find((r: any) => r[fkInJoinTable] === row.id);
            
            // 2. Current table has <join_table>_id that matches foreign table's id (e.g., submissions.user_id = profiles.id)
            if (!relatedRow) {
              // Try standard pattern: profiles -> profile_id
              const fkInCurrentTable = `${join.table.slice(0, -1)}_id`;
              
              if (row[fkInCurrentTable]) {
                relatedRow = joinTable.find((r: any) => r.id === row[fkInCurrentTable]);
              }
              
              // Try alternate pattern for profiles -> user_id
              if (!relatedRow && join.table === 'profiles' && row['user_id']) {
                relatedRow = joinTable.find((r: any) => r.id === row['user_id']);
              }
            }
            
            // 3. Try direct match by id
            if (!relatedRow && row[join.table + '_id']) {
              relatedRow = joinTable.find((r: any) => r.id === row[join.table + '_id']);
            }
            
            if (relatedRow) {
              if (join.fields.includes('*')) {
                result[join.table] = relatedRow;
              } else {
                result[join.table] = {};
                for (const field of join.fields) {
                  result[join.table][field] = relatedRow[field];
                }
              }
            } else {
              result[join.table] = null;
            }
          }
        }
        return result;
      });
    }

    // Apply order
    if (this.orderBy) {
      const { col, ascending } = this.orderBy;
      filtered.sort((a, b) => {
        const aVal = a[col];
        const bVal = b[col];
        if (aVal < bVal) return ascending ? -1 : 1;
        if (aVal > bVal) return ascending ? 1 : -1;
        return 0;
      });
    }

    // Apply limit
    if (this.limitCount !== null) {
      filtered = filtered.slice(0, this.limitCount);
    }

    // Handle single/maybeSingle
    if (this.isSingle || this.isMaybeSingle) {
      if (filtered.length === 0) {
        return this.isMaybeSingle
          ? { data: null, error: null }
          : { data: null, error: { message: 'No rows' } };
      }
      return { data: filtered[0], error: null };
    }

    return { data: filtered, error: null };
  }

  then(resolve: (result: QueryResult) => void) {
    return Promise.resolve(this.execute()).then(resolve);
  }
}

export function makeSupabaseMock(db: SupabaseDatabase) {
  return {
    from(tableName: string) {
      return new QueryBuilder(tableName, db);
    },
    auth: {
      getUser: () =>
        Promise.resolve({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null,
        }),
    },
    rpc: (name: string) => ({
      single: () => Promise.resolve({ data: new Date().toISOString(), error: null }),
    }),
  };
}
