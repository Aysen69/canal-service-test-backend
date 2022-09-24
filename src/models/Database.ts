export type User = {
  id: string,
  login: string,
  password: string,
  sessionId: string,
}

export default class Database {

  public static async register(user: User) {
    if (await this._getUserByLogin(user.login) !== undefined) {
      throw new Error("The login already exists")
    }
    const userId = crypto.randomUUID()
    const newUser: User = {
      id: userId,
      login: user.login,
      password: await this._getHashedPassword(userId, user.login, user.password),
      sessionId: '',
    }
    let data = await CANAL_SERVICE_API_KV.get<{ users: User[] }>('users', 'json')
    if (data === null) throw new Error("Something went wrong")
    data.users.push(newUser)
    await CANAL_SERVICE_API_KV.put('users', JSON.stringify(data))
  }

  public static async login(inputLogin: string, inputPassword: string): Promise<string | undefined> {
    const realUser = await this._getUserByLogin(inputLogin)
    if (realUser === undefined) throw new Error("Incorrect login or password")
    const passwordHash = await this._getHashedPassword(realUser.id, realUser.login, inputPassword)
    if (realUser.login === inputLogin && realUser.password === passwordHash) {
      return this._getNewSessionId(realUser.login)
    }
    throw new Error("Incorrect login or password")
  }

  private static async _getUserByLogin(login: string): Promise<User | undefined> {
    const data = await CANAL_SERVICE_API_KV.get<{ users: User[] }>('users', 'json')
    if (data === null) return
    return data.users.find(user => user.login === login)
  }
  private static async _getNewSessionId(login: string) {
    const user = await this._getUserByLogin(login)
    if (user === undefined) throw new Error("User not found")
    let data = await CANAL_SERVICE_API_KV.get<{ users: User[] }>('users', 'json')
    if (data === null) throw new Error("Something went wrong")
    const userIndex = data.users.findIndex(u => u.login === login)
    const newSessionId = crypto.randomUUID()
    data.users[userIndex].sessionId = newSessionId
    await CANAL_SERVICE_API_KV.put('users', JSON.stringify(data))
    return newSessionId
  }
  private static async _getHashedPassword(id: string, login: string, password: string) {
    const saltedInput = CANAL_SERVICE_PASSWORD_HASH_SALT + "Ded_" + password + "_morOz_" + id + "_Kr@snyiNos_" + login + "_pGorb@tyi" + CANAL_SERVICE_PASSWORD_HASH_SALT
    const msgUnit8 = new TextEncoder().encode(saltedInput)
    const hash = await crypto.subtle.digest("md5", msgUnit8)
    const hashedPassword = new TextDecoder().decode(hash)
    return hashedPassword
  }

}
