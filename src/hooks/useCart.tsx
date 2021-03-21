import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {


    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {

      const productOnCart = cart.find(product => product.id === productId);

      if (productOnCart) {
        const productForUpdate = {
          productId: productOnCart.id,
          amount: productOnCart.amount + 1
        }
        updateProductAmount(productForUpdate)
      } else {
        const product = await api.get<Product>(`/products/${productId}`)
          .then(response => response.data)
          .catch(() => {
            throw new Error('Erro na adição do produto')
          });


        product.amount = 1;

        setCart([...cart, product])

        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, product]));


      }

    } catch (error) {
      toast.error(error.message);

    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productIndex = cart.findIndex(product => product.id === productId);

      if (productIndex < 0) {
        throw new Error('Erro na remoção do produto')
      }

      const findToRemoveProduct = cart.filter(product => product.id !== productId);

      setCart(findToRemoveProduct);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(findToRemoveProduct));


    } catch (error) {
      toast.error(error.message);
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const response: Stock = await api.get(`/stock/${productId}`).then(response => response.data).catch(() => {
        throw new Error('Erro na alteração de quantidade do produto')
      });


      if (amount <= 0) {
        throw new Error('Erro na alteração de quantidade do produto');
      }

      if (response.amount < amount) {
        throw new Error("Quantidade solicitada fora de estoque")
      }

      const findCartItem = cart.find(product => product.id === productId);

      if (!findCartItem) {
        throw new Error('Erro na alteração de quantidade do produto')
      }

      findCartItem.amount = amount;

      setCart([...cart])

      localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart]))

    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
